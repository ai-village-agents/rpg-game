/**
 * Mount and Pet System Tests
 * Comprehensive tests for companion management, abilities, and bonuses
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  MOUNT_TYPE,
  PET_TYPE,
  COMPANION_RARITY,
  PET_ABILITY,
  MOUNT_ABILITY,
  HAPPINESS_LEVEL,
  MOUNT_CONFIG,
  PET_CONFIG,
  HAPPINESS_THRESHOLDS,
  HAPPINESS_MULTIPLIERS,
  RARITY_MULTIPLIERS,
  createCompanionState,
  createMount,
  createPet,
  addMount,
  addPet,
  equipMount,
  unequipMount,
  equipPet,
  unequipPet,
  feedCompanion,
  grantCompanionXp,
  getHappinessLevel,
  calculateMountSpeed,
  getActivePetBonuses,
  getMountAbilities,
  canFly,
  canSwim,
  updateHunger,
  increaseBond,
  upgradeStable,
  upgradeKennel,
  releaseCompanion,
  renameCompanion,
  getCompanionsSortedByLevel,
  getCompanionCountByRarity,
  getXpForLevel
} from '../src/mount-pet-system.js';

import {
  renderCompanionCard,
  renderStablePanel,
  renderKennelPanel,
  renderCompanionHud,
  renderFeedDialog,
  renderRenameDialog,
  renderCollectionSummary,
  renderCompanionObtained,
  renderLevelUp,
  renderMountSelection,
  renderBonusesPanel,
  RARITY_COLORS,
  HAPPINESS_ICONS
} from '../src/mount-pet-system-ui.js';

// ==================== Constants Tests ====================

describe('Mount Types', () => {
  it('should have all expected mount types', () => {
    assert.strictEqual(MOUNT_TYPE.HORSE, 'horse');
    assert.strictEqual(MOUNT_TYPE.WOLF, 'wolf');
    assert.strictEqual(MOUNT_TYPE.BEAR, 'bear');
    assert.strictEqual(MOUNT_TYPE.DRAGON, 'dragon');
    assert.strictEqual(MOUNT_TYPE.GRIFFIN, 'griffin');
    assert.strictEqual(MOUNT_TYPE.UNICORN, 'unicorn');
    assert.strictEqual(MOUNT_TYPE.NIGHTMARE, 'nightmare');
    assert.strictEqual(MOUNT_TYPE.PHOENIX_BIRD, 'phoenix_bird');
  });

  it('should have 8 mount types', () => {
    assert.strictEqual(Object.keys(MOUNT_TYPE).length, 8);
  });
});

describe('Pet Types', () => {
  it('should have all expected pet types', () => {
    assert.strictEqual(PET_TYPE.CAT, 'cat');
    assert.strictEqual(PET_TYPE.DOG, 'dog');
    assert.strictEqual(PET_TYPE.OWL, 'owl');
    assert.strictEqual(PET_TYPE.SNAKE, 'snake');
    assert.strictEqual(PET_TYPE.FAIRY, 'fairy');
    assert.strictEqual(PET_TYPE.IMP, 'imp');
    assert.strictEqual(PET_TYPE.ELEMENTAL, 'elemental');
    assert.strictEqual(PET_TYPE.MIMIC, 'mimic');
  });

  it('should have 8 pet types', () => {
    assert.strictEqual(Object.keys(PET_TYPE).length, 8);
  });
});

describe('Companion Rarity', () => {
  it('should have all rarity levels', () => {
    assert.strictEqual(COMPANION_RARITY.COMMON, 'common');
    assert.strictEqual(COMPANION_RARITY.UNCOMMON, 'uncommon');
    assert.strictEqual(COMPANION_RARITY.RARE, 'rare');
    assert.strictEqual(COMPANION_RARITY.EPIC, 'epic');
    assert.strictEqual(COMPANION_RARITY.LEGENDARY, 'legendary');
  });

  it('should have increasing rarity multipliers', () => {
    assert.ok(RARITY_MULTIPLIERS[COMPANION_RARITY.COMMON] < RARITY_MULTIPLIERS[COMPANION_RARITY.UNCOMMON]);
    assert.ok(RARITY_MULTIPLIERS[COMPANION_RARITY.UNCOMMON] < RARITY_MULTIPLIERS[COMPANION_RARITY.RARE]);
    assert.ok(RARITY_MULTIPLIERS[COMPANION_RARITY.RARE] < RARITY_MULTIPLIERS[COMPANION_RARITY.EPIC]);
    assert.ok(RARITY_MULTIPLIERS[COMPANION_RARITY.EPIC] < RARITY_MULTIPLIERS[COMPANION_RARITY.LEGENDARY]);
  });
});

describe('Happiness Levels', () => {
  it('should have all happiness levels', () => {
    assert.strictEqual(HAPPINESS_LEVEL.MISERABLE, 'miserable');
    assert.strictEqual(HAPPINESS_LEVEL.UNHAPPY, 'unhappy');
    assert.strictEqual(HAPPINESS_LEVEL.CONTENT, 'content');
    assert.strictEqual(HAPPINESS_LEVEL.HAPPY, 'happy');
    assert.strictEqual(HAPPINESS_LEVEL.ECSTATIC, 'ecstatic');
  });

  it('should have increasing happiness thresholds', () => {
    assert.ok(HAPPINESS_THRESHOLDS[HAPPINESS_LEVEL.MISERABLE] < HAPPINESS_THRESHOLDS[HAPPINESS_LEVEL.UNHAPPY]);
    assert.ok(HAPPINESS_THRESHOLDS[HAPPINESS_LEVEL.UNHAPPY] < HAPPINESS_THRESHOLDS[HAPPINESS_LEVEL.CONTENT]);
    assert.ok(HAPPINESS_THRESHOLDS[HAPPINESS_LEVEL.CONTENT] < HAPPINESS_THRESHOLDS[HAPPINESS_LEVEL.HAPPY]);
    assert.ok(HAPPINESS_THRESHOLDS[HAPPINESS_LEVEL.HAPPY] < HAPPINESS_THRESHOLDS[HAPPINESS_LEVEL.ECSTATIC]);
  });

  it('should have increasing happiness multipliers', () => {
    assert.ok(HAPPINESS_MULTIPLIERS[HAPPINESS_LEVEL.MISERABLE] < HAPPINESS_MULTIPLIERS[HAPPINESS_LEVEL.UNHAPPY]);
    assert.ok(HAPPINESS_MULTIPLIERS[HAPPINESS_LEVEL.UNHAPPY] < HAPPINESS_MULTIPLIERS[HAPPINESS_LEVEL.CONTENT]);
    assert.ok(HAPPINESS_MULTIPLIERS[HAPPINESS_LEVEL.CONTENT] < HAPPINESS_MULTIPLIERS[HAPPINESS_LEVEL.HAPPY]);
    assert.ok(HAPPINESS_MULTIPLIERS[HAPPINESS_LEVEL.HAPPY] < HAPPINESS_MULTIPLIERS[HAPPINESS_LEVEL.ECSTATIC]);
  });
});

describe('Mount Config', () => {
  it('should have config for all mount types', () => {
    Object.values(MOUNT_TYPE).forEach(type => {
      assert.ok(MOUNT_CONFIG[type], `Missing config for mount type: ${type}`);
    });
  });

  it('should have valid mount properties', () => {
    Object.values(MOUNT_CONFIG).forEach(config => {
      assert.ok(config.name);
      assert.ok(config.rarity);
      assert.ok(config.baseSpeed > 0);
      assert.ok(Array.isArray(config.abilities));
      assert.ok(config.maxLevel > 0);
      assert.ok(Array.isArray(config.foodTypes));
    });
  });

  it('should have dragon as legendary', () => {
    assert.strictEqual(MOUNT_CONFIG[MOUNT_TYPE.DRAGON].rarity, COMPANION_RARITY.LEGENDARY);
  });

  it('should have dragon with flying ability', () => {
    assert.ok(MOUNT_CONFIG[MOUNT_TYPE.DRAGON].abilities.includes(MOUNT_ABILITY.FLYING));
  });
});

describe('Pet Config', () => {
  it('should have config for all pet types', () => {
    Object.values(PET_TYPE).forEach(type => {
      assert.ok(PET_CONFIG[type], `Missing config for pet type: ${type}`);
    });
  });

  it('should have valid pet properties', () => {
    Object.values(PET_CONFIG).forEach(config => {
      assert.ok(config.name);
      assert.ok(config.rarity);
      assert.ok(Array.isArray(config.abilities));
      assert.ok(config.maxLevel > 0);
      assert.ok(Array.isArray(config.foodTypes));
    });
  });

  it('should have fairy with healing aura', () => {
    assert.ok(PET_CONFIG[PET_TYPE.FAIRY].abilities.includes(PET_ABILITY.HEALING_AURA));
  });
});

// ==================== State Creation Tests ====================

describe('createCompanionState', () => {
  it('should create empty state', () => {
    const state = createCompanionState();
    assert.deepStrictEqual(state.mounts, {});
    assert.deepStrictEqual(state.pets, {});
    assert.strictEqual(state.activeMount, null);
    assert.strictEqual(state.activePet, null);
  });

  it('should initialize stable with default capacity', () => {
    const state = createCompanionState();
    assert.strictEqual(state.stable.capacity, 5);
    assert.strictEqual(state.stable.upgrades, 0);
  });

  it('should initialize kennel with default capacity', () => {
    const state = createCompanionState();
    assert.strictEqual(state.kennel.capacity, 5);
    assert.strictEqual(state.kennel.upgrades, 0);
  });
});

describe('createMount', () => {
  it('should create mount with correct type', () => {
    const mount = createMount(MOUNT_TYPE.HORSE);
    assert.strictEqual(mount.type, MOUNT_TYPE.HORSE);
  });

  it('should create mount with default name', () => {
    const mount = createMount(MOUNT_TYPE.HORSE);
    assert.strictEqual(mount.name, 'Horse');
  });

  it('should create mount with custom name', () => {
    const mount = createMount(MOUNT_TYPE.HORSE, 'Shadow');
    assert.strictEqual(mount.name, 'Shadow');
  });

  it('should create mount at level 1', () => {
    const mount = createMount(MOUNT_TYPE.WOLF);
    assert.strictEqual(mount.level, 1);
    assert.strictEqual(mount.xp, 0);
  });

  it('should create mount with initial happiness', () => {
    const mount = createMount(MOUNT_TYPE.BEAR);
    assert.strictEqual(mount.happiness, 50);
  });

  it('should create mount with initial hunger', () => {
    const mount = createMount(MOUNT_TYPE.GRIFFIN);
    assert.strictEqual(mount.hunger, 100);
  });

  it('should create mount with unique id', () => {
    const mount1 = createMount(MOUNT_TYPE.HORSE);
    const mount2 = createMount(MOUNT_TYPE.HORSE);
    assert.notStrictEqual(mount1.id, mount2.id);
  });

  it('should throw error for invalid mount type', () => {
    assert.throws(() => createMount('invalid_type'), /Invalid mount type/);
  });

  it('should assign correct rarity from config', () => {
    const horse = createMount(MOUNT_TYPE.HORSE);
    const dragon = createMount(MOUNT_TYPE.DRAGON);
    assert.strictEqual(horse.rarity, COMPANION_RARITY.COMMON);
    assert.strictEqual(dragon.rarity, COMPANION_RARITY.LEGENDARY);
  });

  it('should copy abilities from config', () => {
    const dragon = createMount(MOUNT_TYPE.DRAGON);
    assert.ok(dragon.abilities.includes(MOUNT_ABILITY.FLYING));
    assert.ok(dragon.abilities.includes(MOUNT_ABILITY.COMBAT_MOUNT));
  });
});

describe('createPet', () => {
  it('should create pet with correct type', () => {
    const pet = createPet(PET_TYPE.CAT);
    assert.strictEqual(pet.type, PET_TYPE.CAT);
  });

  it('should create pet with default name', () => {
    const pet = createPet(PET_TYPE.DOG);
    assert.strictEqual(pet.name, 'Dog');
  });

  it('should create pet with custom name', () => {
    const pet = createPet(PET_TYPE.CAT, 'Whiskers');
    assert.strictEqual(pet.name, 'Whiskers');
  });

  it('should create pet at level 1', () => {
    const pet = createPet(PET_TYPE.OWL);
    assert.strictEqual(pet.level, 1);
  });

  it('should throw error for invalid pet type', () => {
    assert.throws(() => createPet('invalid_type'), /Invalid pet type/);
  });

  it('should create pet with bond level 0', () => {
    const pet = createPet(PET_TYPE.FAIRY);
    assert.strictEqual(pet.bondLevel, 0);
  });
});

// ==================== Add Mount/Pet Tests ====================

describe('addMount', () => {
  it('should add mount to empty stable', () => {
    const state = createCompanionState();
    const mount = createMount(MOUNT_TYPE.HORSE);
    const result = addMount(state, mount);

    assert.strictEqual(result.success, true);
    assert.ok(result.state.mounts[mount.id]);
  });

  it('should fail when stable is full', () => {
    let state = createCompanionState();

    // Fill stable
    for (let i = 0; i < 5; i++) {
      const mount = createMount(MOUNT_TYPE.HORSE);
      const result = addMount(state, mount);
      state = result.state;
    }

    // Try to add one more
    const extraMount = createMount(MOUNT_TYPE.WOLF);
    const result = addMount(state, extraMount);

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'Stable is full');
  });

  it('should preserve existing mounts', () => {
    let state = createCompanionState();
    const mount1 = createMount(MOUNT_TYPE.HORSE);
    const mount2 = createMount(MOUNT_TYPE.WOLF);

    state = addMount(state, mount1).state;
    state = addMount(state, mount2).state;

    assert.ok(state.mounts[mount1.id]);
    assert.ok(state.mounts[mount2.id]);
  });
});

describe('addPet', () => {
  it('should add pet to empty kennel', () => {
    const state = createCompanionState();
    const pet = createPet(PET_TYPE.CAT);
    const result = addPet(state, pet);

    assert.strictEqual(result.success, true);
    assert.ok(result.state.pets[pet.id]);
  });

  it('should fail when kennel is full', () => {
    let state = createCompanionState();

    // Fill kennel
    for (let i = 0; i < 5; i++) {
      const pet = createPet(PET_TYPE.DOG);
      const result = addPet(state, pet);
      state = result.state;
    }

    // Try to add one more
    const extraPet = createPet(PET_TYPE.CAT);
    const result = addPet(state, extraPet);

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'Kennel is full');
  });
});

// ==================== Equip/Unequip Tests ====================

describe('equipMount', () => {
  it('should equip mount', () => {
    let state = createCompanionState();
    const mount = createMount(MOUNT_TYPE.HORSE);
    state = addMount(state, mount).state;

    const result = equipMount(state, mount.id);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.state.activeMount, mount.id);
    assert.strictEqual(result.state.mounts[mount.id].equipped, true);
  });

  it('should fail for non-existent mount', () => {
    const state = createCompanionState();
    const result = equipMount(state, 'fake_id');

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'Mount not found');
  });

  it('should unequip previous mount when equipping new one', () => {
    let state = createCompanionState();
    const mount1 = createMount(MOUNT_TYPE.HORSE);
    const mount2 = createMount(MOUNT_TYPE.WOLF);

    state = addMount(state, mount1).state;
    state = addMount(state, mount2).state;
    state = equipMount(state, mount1.id).state;
    state = equipMount(state, mount2.id).state;

    assert.strictEqual(state.activeMount, mount2.id);
    assert.strictEqual(state.mounts[mount1.id].equipped, false);
    assert.strictEqual(state.mounts[mount2.id].equipped, true);
  });
});

describe('unequipMount', () => {
  it('should unequip mount', () => {
    let state = createCompanionState();
    const mount = createMount(MOUNT_TYPE.HORSE);
    state = addMount(state, mount).state;
    state = equipMount(state, mount.id).state;

    const result = unequipMount(state);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.state.activeMount, null);
    assert.strictEqual(result.state.mounts[mount.id].equipped, false);
  });

  it('should fail when no mount equipped', () => {
    const state = createCompanionState();
    const result = unequipMount(state);

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'No mount equipped');
  });
});

describe('equipPet', () => {
  it('should equip pet', () => {
    let state = createCompanionState();
    const pet = createPet(PET_TYPE.CAT);
    state = addPet(state, pet).state;

    const result = equipPet(state, pet.id);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.state.activePet, pet.id);
    assert.strictEqual(result.state.pets[pet.id].equipped, true);
  });

  it('should fail for non-existent pet', () => {
    const state = createCompanionState();
    const result = equipPet(state, 'fake_id');

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'Pet not found');
  });
});

describe('unequipPet', () => {
  it('should unequip pet', () => {
    let state = createCompanionState();
    const pet = createPet(PET_TYPE.DOG);
    state = addPet(state, pet).state;
    state = equipPet(state, pet.id).state;

    const result = unequipPet(state);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.state.activePet, null);
  });

  it('should fail when no pet equipped', () => {
    const state = createCompanionState();
    const result = unequipPet(state);

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'No pet equipped');
  });
});

// ==================== Feeding Tests ====================

describe('feedCompanion', () => {
  it('should feed mount with valid food', () => {
    let state = createCompanionState();
    const mount = createMount(MOUNT_TYPE.HORSE);
    mount.hunger = 50;
    state = addMount(state, mount).state;

    const result = feedCompanion(state, mount.id, 'hay', true);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.hungerRestored, 25);
    assert.strictEqual(result.state.mounts[mount.id].hunger, 75);
  });

  it('should increase happiness when fed', () => {
    let state = createCompanionState();
    const mount = createMount(MOUNT_TYPE.HORSE);
    mount.happiness = 40;
    state = addMount(state, mount).state;

    const result = feedCompanion(state, mount.id, 'apple', true);

    assert.strictEqual(result.happinessGained, 10);
    assert.strictEqual(result.state.mounts[mount.id].happiness, 50);
  });

  it('should grant XP when fed', () => {
    let state = createCompanionState();
    const mount = createMount(MOUNT_TYPE.HORSE);
    state = addMount(state, mount).state;

    const result = feedCompanion(state, mount.id, 'carrot', true);

    assert.strictEqual(result.xpGained, 5);
  });

  it('should fail with wrong food type', () => {
    let state = createCompanionState();
    const mount = createMount(MOUNT_TYPE.HORSE);
    state = addMount(state, mount).state;

    const result = feedCompanion(state, mount.id, 'meat', true);

    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes("doesn't like"));
  });

  it('should cap hunger at 100', () => {
    let state = createCompanionState();
    const mount = createMount(MOUNT_TYPE.HORSE);
    mount.hunger = 90;
    state = addMount(state, mount).state;

    const result = feedCompanion(state, mount.id, 'hay', true);

    assert.strictEqual(result.state.mounts[mount.id].hunger, 100);
  });

  it('should feed pet correctly', () => {
    let state = createCompanionState();
    const pet = createPet(PET_TYPE.CAT);
    pet.hunger = 50;
    state = addPet(state, pet).state;

    const result = feedCompanion(state, pet.id, 'fish', false);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.state.pets[pet.id].hunger, 75);
  });

  it('should fail for non-existent companion', () => {
    const state = createCompanionState();
    const result = feedCompanion(state, 'fake_id', 'hay', true);

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'Mount not found');
  });
});

// ==================== XP and Level Tests ====================

describe('getXpForLevel', () => {
  it('should return base XP for level 2', () => {
    // Formula: 100 * 1.15^(level-1), floored
    // For level 2: 100 * 1.15 = 115, floor = 115
    const xp = getXpForLevel(2);
    assert.ok(xp >= 100 && xp <= 120);
  });

  it('should increase exponentially', () => {
    const xp2 = getXpForLevel(2);
    const xp3 = getXpForLevel(3);
    const xp4 = getXpForLevel(4);

    assert.ok(xp3 > xp2);
    assert.ok(xp4 > xp3);
  });
});

describe('grantCompanionXp', () => {
  it('should grant XP to mount', () => {
    let state = createCompanionState();
    const mount = createMount(MOUNT_TYPE.HORSE);
    state = addMount(state, mount).state;

    const result = grantCompanionXp(state, mount.id, 50, true);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.xpGranted, 50);
    assert.strictEqual(result.state.mounts[mount.id].xp, 50);
  });

  it('should level up when XP threshold reached', () => {
    let state = createCompanionState();
    const mount = createMount(MOUNT_TYPE.HORSE);
    state = addMount(state, mount).state;

    const result = grantCompanionXp(state, mount.id, 150, true);

    assert.strictEqual(result.leveledUp, true);
    assert.strictEqual(result.newLevel, 2);
  });

  it('should grant XP to pet', () => {
    let state = createCompanionState();
    const pet = createPet(PET_TYPE.DOG);
    state = addPet(state, pet).state;

    const result = grantCompanionXp(state, pet.id, 75, false);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.state.pets[pet.id].xp, 75);
  });

  it('should fail for non-existent companion', () => {
    const state = createCompanionState();
    const result = grantCompanionXp(state, 'fake_id', 100, true);

    assert.strictEqual(result.success, false);
  });
});

// ==================== Happiness Tests ====================

describe('getHappinessLevel', () => {
  it('should return miserable for 0-19', () => {
    assert.strictEqual(getHappinessLevel(0), HAPPINESS_LEVEL.MISERABLE);
    assert.strictEqual(getHappinessLevel(19), HAPPINESS_LEVEL.MISERABLE);
  });

  it('should return unhappy for 20-39', () => {
    assert.strictEqual(getHappinessLevel(20), HAPPINESS_LEVEL.UNHAPPY);
    assert.strictEqual(getHappinessLevel(39), HAPPINESS_LEVEL.UNHAPPY);
  });

  it('should return content for 40-69', () => {
    assert.strictEqual(getHappinessLevel(40), HAPPINESS_LEVEL.CONTENT);
    assert.strictEqual(getHappinessLevel(69), HAPPINESS_LEVEL.CONTENT);
  });

  it('should return happy for 70-89', () => {
    assert.strictEqual(getHappinessLevel(70), HAPPINESS_LEVEL.HAPPY);
    assert.strictEqual(getHappinessLevel(89), HAPPINESS_LEVEL.HAPPY);
  });

  it('should return ecstatic for 90-100', () => {
    assert.strictEqual(getHappinessLevel(90), HAPPINESS_LEVEL.ECSTATIC);
    assert.strictEqual(getHappinessLevel(100), HAPPINESS_LEVEL.ECSTATIC);
  });
});

// ==================== Speed and Bonus Tests ====================

describe('calculateMountSpeed', () => {
  it('should return 1.0 with no mount', () => {
    const state = createCompanionState();
    assert.strictEqual(calculateMountSpeed(state), 1.0);
  });

  it('should return base speed with mount', () => {
    let state = createCompanionState();
    const mount = createMount(MOUNT_TYPE.HORSE);
    state = addMount(state, mount).state;
    state = equipMount(state, mount.id).state;

    const speed = calculateMountSpeed(state);
    assert.ok(speed > 1.0);
  });

  it('should factor in happiness', () => {
    let state = createCompanionState();
    const mount = createMount(MOUNT_TYPE.HORSE);
    mount.happiness = 100; // Ecstatic
    state = addMount(state, mount).state;
    state = equipMount(state, mount.id).state;

    const happySpeed = calculateMountSpeed(state);

    // Create sad mount
    let state2 = createCompanionState();
    const mount2 = createMount(MOUNT_TYPE.HORSE);
    mount2.happiness = 10; // Miserable
    state2 = addMount(state2, mount2).state;
    state2 = equipMount(state2, mount2.id).state;

    const sadSpeed = calculateMountSpeed(state2);

    assert.ok(happySpeed > sadSpeed);
  });

  it('should factor in level', () => {
    let state = createCompanionState();
    const mount = createMount(MOUNT_TYPE.HORSE);
    mount.level = 10;
    state = addMount(state, mount).state;
    state = equipMount(state, mount.id).state;

    const highLevelSpeed = calculateMountSpeed(state);

    let state2 = createCompanionState();
    const mount2 = createMount(MOUNT_TYPE.HORSE);
    mount2.level = 1;
    state2 = addMount(state2, mount2).state;
    state2 = equipMount(state2, mount2.id).state;

    const lowLevelSpeed = calculateMountSpeed(state2);

    assert.ok(highLevelSpeed > lowLevelSpeed);
  });
});

describe('getActivePetBonuses', () => {
  it('should return zero bonuses with no pet', () => {
    const state = createCompanionState();
    const bonuses = getActivePetBonuses(state);

    assert.strictEqual(bonuses.xpBoost, 0);
    assert.strictEqual(bonuses.goldBoost, 0);
    assert.strictEqual(bonuses.lootFinder, 0);
  });

  it('should return bonuses based on pet abilities', () => {
    let state = createCompanionState();
    const pet = createPet(PET_TYPE.CAT); // Has LOOT_FINDER and STEALTH_BONUS
    state = addPet(state, pet).state;
    state = equipPet(state, pet.id).state;

    const bonuses = getActivePetBonuses(state);

    assert.ok(bonuses.lootFinder > 0);
    assert.ok(bonuses.stealthBonus > 0);
  });

  it('should scale with pet level', () => {
    let state = createCompanionState();
    const pet = createPet(PET_TYPE.DOG);
    pet.level = 10;
    state = addPet(state, pet).state;
    state = equipPet(state, pet.id).state;

    const highLevelBonuses = getActivePetBonuses(state);

    let state2 = createCompanionState();
    const pet2 = createPet(PET_TYPE.DOG);
    pet2.level = 1;
    state2 = addPet(state2, pet2).state;
    state2 = equipPet(state2, pet2.id).state;

    const lowLevelBonuses = getActivePetBonuses(state2);

    assert.ok(highLevelBonuses.xpBoost > lowLevelBonuses.xpBoost);
  });
});

describe('getMountAbilities', () => {
  it('should return empty array with no mount', () => {
    const state = createCompanionState();
    const abilities = getMountAbilities(state);
    assert.deepStrictEqual(abilities, []);
  });

  it('should return mount abilities when equipped', () => {
    let state = createCompanionState();
    const mount = createMount(MOUNT_TYPE.DRAGON);
    state = addMount(state, mount).state;
    state = equipMount(state, mount.id).state;

    const abilities = getMountAbilities(state);

    assert.ok(abilities.includes(MOUNT_ABILITY.FLYING));
  });
});

describe('canFly', () => {
  it('should return false with no mount', () => {
    const state = createCompanionState();
    assert.strictEqual(canFly(state), false);
  });

  it('should return true for flying mount', () => {
    let state = createCompanionState();
    const mount = createMount(MOUNT_TYPE.GRIFFIN);
    state = addMount(state, mount).state;
    state = equipMount(state, mount.id).state;

    assert.strictEqual(canFly(state), true);
  });

  it('should return false for non-flying mount', () => {
    let state = createCompanionState();
    const mount = createMount(MOUNT_TYPE.HORSE);
    state = addMount(state, mount).state;
    state = equipMount(state, mount.id).state;

    assert.strictEqual(canFly(state), false);
  });
});

describe('canSwim', () => {
  it('should return false with no mount', () => {
    const state = createCompanionState();
    assert.strictEqual(canSwim(state), false);
  });
});

// ==================== Hunger Update Tests ====================

describe('updateHunger', () => {
  it('should decrease hunger over time', () => {
    let state = createCompanionState();
    const mount = createMount(MOUNT_TYPE.HORSE);
    state = addMount(state, mount).state;

    const updated = updateHunger(state, 10); // 10 minutes

    assert.ok(updated.mounts[mount.id].hunger < 100);
  });

  it('should not go below 0', () => {
    let state = createCompanionState();
    const mount = createMount(MOUNT_TYPE.HORSE);
    state = addMount(state, mount).state;

    const updated = updateHunger(state, 300); // 300 minutes

    assert.ok(updated.mounts[mount.id].hunger >= 0);
  });

  it('should decrease happiness when very hungry', () => {
    let state = createCompanionState();
    const mount = createMount(MOUNT_TYPE.HORSE);
    mount.hunger = 5;
    mount.happiness = 50;
    state = addMount(state, mount).state;

    const updated = updateHunger(state, 1);

    assert.ok(updated.mounts[mount.id].happiness < 50);
  });
});

// ==================== Bond Tests ====================

describe('increaseBond', () => {
  it('should increase bond level', () => {
    let state = createCompanionState();
    const mount = createMount(MOUNT_TYPE.HORSE);
    state = addMount(state, mount).state;

    const result = increaseBond(state, mount.id, 10, true);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.newBondLevel, 10);
  });

  it('should cap at 100', () => {
    let state = createCompanionState();
    const mount = createMount(MOUNT_TYPE.HORSE);
    mount.bondLevel = 95;
    state = addMount(state, mount).state;

    const result = increaseBond(state, mount.id, 20, true);

    assert.strictEqual(result.newBondLevel, 100);
  });

  it('should fail for non-existent companion', () => {
    const state = createCompanionState();
    const result = increaseBond(state, 'fake_id', 10, true);

    assert.strictEqual(result.success, false);
  });
});

// ==================== Upgrade Tests ====================

describe('upgradeStable', () => {
  it('should increase stable capacity', () => {
    const state = createCompanionState();
    const result = upgradeStable(state);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.newCapacity, 7);
    assert.strictEqual(result.state.stable.upgrades, 1);
  });

  it('should fail at max upgrades', () => {
    let state = createCompanionState();
    state.stable.upgrades = 5;

    const result = upgradeStable(state);

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'Stable already at maximum capacity');
  });
});

describe('upgradeKennel', () => {
  it('should increase kennel capacity', () => {
    const state = createCompanionState();
    const result = upgradeKennel(state);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.newCapacity, 7);
    assert.strictEqual(result.state.kennel.upgrades, 1);
  });

  it('should fail at max upgrades', () => {
    let state = createCompanionState();
    state.kennel.upgrades = 5;

    const result = upgradeKennel(state);

    assert.strictEqual(result.success, false);
  });
});

// ==================== Release Tests ====================

describe('releaseCompanion', () => {
  it('should release mount', () => {
    let state = createCompanionState();
    const mount = createMount(MOUNT_TYPE.HORSE);
    state = addMount(state, mount).state;

    const result = releaseCompanion(state, mount.id, true);

    assert.strictEqual(result.success, true);
    assert.ok(!result.state.mounts[mount.id]);
  });

  it('should fail to release equipped mount', () => {
    let state = createCompanionState();
    const mount = createMount(MOUNT_TYPE.HORSE);
    state = addMount(state, mount).state;
    state = equipMount(state, mount.id).state;

    const result = releaseCompanion(state, mount.id, true);

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'Cannot release equipped mount');
  });

  it('should release pet', () => {
    let state = createCompanionState();
    const pet = createPet(PET_TYPE.CAT);
    state = addPet(state, pet).state;

    const result = releaseCompanion(state, pet.id, false);

    assert.strictEqual(result.success, true);
    assert.ok(!result.state.pets[pet.id]);
  });

  it('should fail to release equipped pet', () => {
    let state = createCompanionState();
    const pet = createPet(PET_TYPE.CAT);
    state = addPet(state, pet).state;
    state = equipPet(state, pet.id).state;

    const result = releaseCompanion(state, pet.id, false);

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'Cannot release equipped pet');
  });
});

// ==================== Rename Tests ====================

describe('renameCompanion', () => {
  it('should rename mount', () => {
    let state = createCompanionState();
    const mount = createMount(MOUNT_TYPE.HORSE);
    state = addMount(state, mount).state;

    const result = renameCompanion(state, mount.id, 'Thunder', true);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.state.mounts[mount.id].name, 'Thunder');
  });

  it('should rename pet', () => {
    let state = createCompanionState();
    const pet = createPet(PET_TYPE.DOG);
    state = addPet(state, pet).state;

    const result = renameCompanion(state, pet.id, 'Buddy', false);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.state.pets[pet.id].name, 'Buddy');
  });

  it('should fail with empty name', () => {
    let state = createCompanionState();
    const mount = createMount(MOUNT_TYPE.HORSE);
    state = addMount(state, mount).state;

    const result = renameCompanion(state, mount.id, '', true);

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'Name cannot be empty');
  });

  it('should fail with name too long', () => {
    let state = createCompanionState();
    const mount = createMount(MOUNT_TYPE.HORSE);
    state = addMount(state, mount).state;

    const longName = 'A'.repeat(31);
    const result = renameCompanion(state, mount.id, longName, true);

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'Name too long (max 30 characters)');
  });

  it('should trim whitespace', () => {
    let state = createCompanionState();
    const mount = createMount(MOUNT_TYPE.HORSE);
    state = addMount(state, mount).state;

    const result = renameCompanion(state, mount.id, '  Shadow  ', true);

    assert.strictEqual(result.state.mounts[mount.id].name, 'Shadow');
  });
});

// ==================== Sorting and Count Tests ====================

describe('getCompanionsSortedByLevel', () => {
  it('should sort mounts by level descending', () => {
    let state = createCompanionState();
    const mount1 = createMount(MOUNT_TYPE.HORSE);
    mount1.level = 5;
    const mount2 = createMount(MOUNT_TYPE.WOLF);
    mount2.level = 10;
    const mount3 = createMount(MOUNT_TYPE.BEAR);
    mount3.level = 3;

    state = addMount(state, mount1).state;
    state = addMount(state, mount2).state;
    state = addMount(state, mount3).state;

    const sorted = getCompanionsSortedByLevel(state, true);

    assert.strictEqual(sorted[0].level, 10);
    assert.strictEqual(sorted[1].level, 5);
    assert.strictEqual(sorted[2].level, 3);
  });

  it('should sort pets by level descending', () => {
    let state = createCompanionState();
    const pet1 = createPet(PET_TYPE.CAT);
    pet1.level = 2;
    const pet2 = createPet(PET_TYPE.DOG);
    pet2.level = 8;

    state = addPet(state, pet1).state;
    state = addPet(state, pet2).state;

    const sorted = getCompanionsSortedByLevel(state, false);

    assert.strictEqual(sorted[0].level, 8);
    assert.strictEqual(sorted[1].level, 2);
  });
});

describe('getCompanionCountByRarity', () => {
  it('should count mounts by rarity', () => {
    let state = createCompanionState();
    const horse = createMount(MOUNT_TYPE.HORSE); // Common
    const wolf = createMount(MOUNT_TYPE.WOLF); // Uncommon
    const dragon = createMount(MOUNT_TYPE.DRAGON); // Legendary

    state = addMount(state, horse).state;
    state = addMount(state, wolf).state;
    state = addMount(state, dragon).state;

    const counts = getCompanionCountByRarity(state, true);

    assert.strictEqual(counts[COMPANION_RARITY.COMMON], 1);
    assert.strictEqual(counts[COMPANION_RARITY.UNCOMMON], 1);
    assert.strictEqual(counts[COMPANION_RARITY.LEGENDARY], 1);
  });

  it('should count pets by rarity', () => {
    let state = createCompanionState();
    const cat = createPet(PET_TYPE.CAT); // Common
    const dog = createPet(PET_TYPE.DOG); // Common

    state = addPet(state, cat).state;
    state = addPet(state, dog).state;

    const counts = getCompanionCountByRarity(state, false);

    assert.strictEqual(counts[COMPANION_RARITY.COMMON], 2);
  });
});

// ==================== UI Tests ====================

describe('renderCompanionCard', () => {
  it('should render mount card', () => {
    const mount = createMount(MOUNT_TYPE.HORSE);
    const html = renderCompanionCard(mount, true, false);

    assert.ok(html.includes('companion-card'));
    assert.ok(html.includes('Horse'));
    assert.ok(html.includes('Lv.1'));
  });

  it('should show active badge when equipped', () => {
    const mount = createMount(MOUNT_TYPE.WOLF);
    const html = renderCompanionCard(mount, true, true);

    assert.ok(html.includes('ACTIVE'));
    assert.ok(html.includes('active'));
  });

  it('should show equip button when not equipped', () => {
    const pet = createPet(PET_TYPE.CAT);
    const html = renderCompanionCard(pet, false, false);

    assert.ok(html.includes('btn-equip'));
  });

  it('should show unequip button when equipped', () => {
    const pet = createPet(PET_TYPE.DOG);
    const html = renderCompanionCard(pet, false, true);

    assert.ok(html.includes('btn-unequip'));
  });

  it('should escape HTML in name', () => {
    const mount = createMount(MOUNT_TYPE.HORSE, '<script>alert("xss")</script>');
    const html = renderCompanionCard(mount, true, false);

    assert.ok(!html.includes('<script>'));
  });
});

describe('renderStablePanel', () => {
  it('should render stable panel', () => {
    const state = createCompanionState();
    const html = renderStablePanel(state);

    assert.ok(html.includes('stable-panel'));
    assert.ok(html.includes('Stable'));
  });

  it('should show capacity', () => {
    const state = createCompanionState();
    const html = renderStablePanel(state);

    assert.ok(html.includes('0 / 5'));
  });

  it('should show empty message when no mounts', () => {
    const state = createCompanionState();
    const html = renderStablePanel(state);

    assert.ok(html.includes('No mounts in stable'));
  });

  it('should render mount cards', () => {
    let state = createCompanionState();
    const mount = createMount(MOUNT_TYPE.HORSE);
    state = addMount(state, mount).state;

    const html = renderStablePanel(state);

    assert.ok(html.includes('Horse'));
  });
});

describe('renderKennelPanel', () => {
  it('should render kennel panel', () => {
    const state = createCompanionState();
    const html = renderKennelPanel(state);

    assert.ok(html.includes('kennel-panel'));
    assert.ok(html.includes('Kennel'));
  });

  it('should show empty message when no pets', () => {
    const state = createCompanionState();
    const html = renderKennelPanel(state);

    assert.ok(html.includes('No pets in kennel'));
  });
});

describe('renderCompanionHud', () => {
  it('should render HUD', () => {
    const state = createCompanionState();
    const html = renderCompanionHud(state);

    assert.ok(html.includes('companion-hud'));
  });

  it('should show no mount when none equipped', () => {
    const state = createCompanionState();
    const html = renderCompanionHud(state);

    assert.ok(html.includes('No mount'));
  });

  it('should show no pet when none equipped', () => {
    const state = createCompanionState();
    const html = renderCompanionHud(state);

    assert.ok(html.includes('No pet'));
  });
});

describe('renderFeedDialog', () => {
  it('should render feed dialog for mount', () => {
    const mount = createMount(MOUNT_TYPE.HORSE);
    const html = renderFeedDialog(mount, true);

    assert.ok(html.includes('feed-dialog'));
    assert.ok(html.includes('Horse'));
    assert.ok(html.includes('hay'));
  });

  it('should render feed dialog for pet', () => {
    const pet = createPet(PET_TYPE.CAT);
    const html = renderFeedDialog(pet, false);

    assert.ok(html.includes('feed-dialog'));
    assert.ok(html.includes('Cat'));
    assert.ok(html.includes('fish'));
  });
});

describe('renderRenameDialog', () => {
  it('should render rename dialog', () => {
    const mount = createMount(MOUNT_TYPE.WOLF);
    const html = renderRenameDialog(mount);

    assert.ok(html.includes('rename-dialog'));
    assert.ok(html.includes('Rename'));
    assert.ok(html.includes('Dire Wolf'));
  });
});

describe('renderCollectionSummary', () => {
  it('should render collection summary', () => {
    const state = createCompanionState();
    const html = renderCollectionSummary(state);

    assert.ok(html.includes('collection-summary'));
    assert.ok(html.includes('Mounts'));
    assert.ok(html.includes('Pets'));
  });
});

describe('renderCompanionObtained', () => {
  it('should render obtained notification', () => {
    const mount = createMount(MOUNT_TYPE.DRAGON, 'Smaug');
    const html = renderCompanionObtained(mount, true);

    assert.ok(html.includes('companion-obtained'));
    assert.ok(html.includes('New Mount Obtained'));
    assert.ok(html.includes('Smaug'));
    assert.ok(html.includes('LEGENDARY'));
  });
});

describe('renderLevelUp', () => {
  it('should render level up notification', () => {
    const pet = createPet(PET_TYPE.FAIRY);
    const html = renderLevelUp(pet, 5, false);

    assert.ok(html.includes('level-up-notification'));
    assert.ok(html.includes('Fairy'));
    assert.ok(html.includes('5'));
  });
});

describe('renderMountSelection', () => {
  it('should show empty message when no mounts', () => {
    const state = createCompanionState();
    const html = renderMountSelection(state);

    assert.ok(html.includes("don't have any mounts"));
  });

  it('should render mount options', () => {
    let state = createCompanionState();
    const mount = createMount(MOUNT_TYPE.GRIFFIN);
    state = addMount(state, mount).state;

    const html = renderMountSelection(state);

    assert.ok(html.includes('mount-option'));
    assert.ok(html.includes('Griffin'));
  });
});

describe('renderBonusesPanel', () => {
  it('should render bonuses panel', () => {
    const state = createCompanionState();
    const html = renderBonusesPanel(state);

    assert.ok(html.includes('bonuses-panel'));
    assert.ok(html.includes('Active Bonuses'));
  });

  it('should show movement speed', () => {
    let state = createCompanionState();
    const mount = createMount(MOUNT_TYPE.HORSE);
    state = addMount(state, mount).state;
    state = equipMount(state, mount.id).state;

    const html = renderBonusesPanel(state);

    assert.ok(html.includes('Movement Speed'));
  });
});

describe('UI Constants', () => {
  it('should have rarity colors for all rarities', () => {
    Object.values(COMPANION_RARITY).forEach(rarity => {
      assert.ok(RARITY_COLORS[rarity]);
    });
  });

  it('should have happiness icons for all levels', () => {
    Object.values(HAPPINESS_LEVEL).forEach(level => {
      assert.ok(HAPPINESS_ICONS[level]);
    });
  });
});
