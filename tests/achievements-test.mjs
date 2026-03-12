import assert from 'node:assert';
import { trackAchievements, isUnlocked, getProgress, getAllAchievements, getAchievementsByCategory, getUnlockedCount, getTotalCount } from '../src/achievements.js';
import { ENEMIES } from '../src/data/enemies.js';

console.log('Running Achievement System Tests...\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`✗ ${name}`);
    console.log(`  ${err.message}`);
    failed++;
  }
}

// Helper to create mock state
function createMockState(overrides = {}) {
  return {
    kills: 0,
    gold: 0,
    level: 1,
    xp: 0,
    explored: [],
    quests: [],
    completedQuests: [],
    inventory: [],
    achievements: [],
    shopPurchases: 0,
    ...overrides
  };
}

// === COMBAT ACHIEVEMENTS ===
test('first_blood: Unlock on first kill', () => {
  const state = createMockState({ kills: 1 });
  const result = trackAchievements(state);
  assert(isUnlocked(result, 'first_blood'), 'first_blood should be unlocked');
});

test('first_blood: Not unlocked with zero kills', () => {
  const state = createMockState({ kills: 0 });
  const result = trackAchievements(state);
  assert(!isUnlocked(result, 'first_blood'), 'first_blood should not be unlocked');
});

test('veteran: Unlock at 10 kills', () => {
  const state = createMockState({ kills: 10 });
  const result = trackAchievements(state);
  assert(isUnlocked(result, 'veteran'), 'veteran should be unlocked');
});

test('veteran: Not unlocked at 9 kills', () => {
  const state = createMockState({ kills: 9 });
  const result = trackAchievements(state);
  assert(!isUnlocked(result, 'veteran'), 'veteran should not be unlocked');
});

test('slayer: Unlock at 50 kills', () => {
  const state = createMockState({ kills: 50 });
  const result = trackAchievements(state);
  assert(isUnlocked(result, 'slayer'), 'slayer should be unlocked');
});

test('slayer: Not unlocked at 49 kills', () => {
  const state = createMockState({ kills: 49 });
  const result = trackAchievements(state);
  assert(!isUnlocked(result, 'slayer'), 'slayer should not be unlocked');
});

test('legend: Unlock at 100 kills', () => {
  const state = createMockState({ kills: 100 });
  const result = trackAchievements(state);
  assert(isUnlocked(result, 'legend'), 'legend should be unlocked');
});

test('perfect_combat: Unlock with perfect combat flag', () => {
  const state = createMockState({ perfectCombat: true });
  const result = trackAchievements(state);
  assert(isUnlocked(result, 'perfect_combat'), 'perfect_combat should be unlocked');
});

test('perfect_combat: Not unlocked without flag', () => {
  const state = createMockState({ perfectCombat: false });
  const result = trackAchievements(state);
  assert(!isUnlocked(result, 'perfect_combat'), 'perfect_combat should not be unlocked');
});

// === EXPLORATION ACHIEVEMENTS ===
test('first_steps: Unlock on first room explored', () => {
  const state = createMockState({ explored: ['room1'] });
  const result = trackAchievements(state);
  assert(isUnlocked(result, 'first_steps'), 'first_steps should be unlocked');
});

test('first_steps: Not unlocked with no exploration', () => {
  const state = createMockState({ explored: [] });
  const result = trackAchievements(state);
  assert(!isUnlocked(result, 'first_steps'), 'first_steps should not be unlocked');
});

test('wanderer: Unlock at 5 rooms explored', () => {
  const state = createMockState({ explored: ['r1', 'r2', 'r3', 'r4', 'r5'] });
  const result = trackAchievements(state);
  assert(isUnlocked(result, 'wanderer'), 'wanderer should be unlocked');
});

test('pathfinder: Unlock at 15 rooms explored', () => {
  const state = createMockState({ explored: Array.from({length: 15}, (_, i) => `r${i}`) });
  const result = trackAchievements(state);
  assert(isUnlocked(result, 'pathfinder'), 'pathfinder should be unlocked');
});

test('cartographer: Unlock at 30 rooms explored', () => {
  const state = createMockState({ explored: Array.from({length: 30}, (_, i) => `r${i}`) });
  const result = trackAchievements(state);
  assert(isUnlocked(result, 'cartographer'), 'cartographer should be unlocked');
});

// === PROGRESSION ACHIEVEMENTS ===
test('apprentice: Unlock at level 5', () => {
  const state = createMockState({ level: 5 });
  const result = trackAchievements(state);
  assert(isUnlocked(result, 'apprentice'), 'apprentice should be unlocked');
});

test('apprentice: Not unlocked at level 4', () => {
  const state = createMockState({ level: 4 });
  const result = trackAchievements(state);
  assert(!isUnlocked(result, 'apprentice'), 'apprentice should not be unlocked');
});

test('journeyman: Unlock at level 10', () => {
  const state = createMockState({ level: 10 });
  const result = trackAchievements(state);
  assert(isUnlocked(result, 'journeyman'), 'journeyman should be unlocked');
});

test('expert: Unlock at level 15', () => {
  const state = createMockState({ level: 15 });
  const result = trackAchievements(state);
  assert(isUnlocked(result, 'expert'), 'expert should be unlocked');
});

test('master: Unlock at level 20', () => {
  const state = createMockState({ level: 20 });
  const result = trackAchievements(state);
  assert(isUnlocked(result, 'master'), 'master should be unlocked');
});

test('xp_hunter: Unlock at 1000 XP', () => {
  const state = createMockState({ xp: 1000 });
  const result = trackAchievements(state);
  assert(isUnlocked(result, 'xp_hunter'), 'xp_hunter should be unlocked');
});

test('xp_master: Unlock at 5000 XP', () => {
  const state = createMockState({ xp: 5000 });
  const result = trackAchievements(state);
  assert(isUnlocked(result, 'xp_master'), 'xp_master should be unlocked');
});

// === COLLECTION ACHIEVEMENTS ===
test('first_coin: Unlock at 100 gold', () => {
  const state = createMockState({ gold: 100 });
  const result = trackAchievements(state);
  assert(isUnlocked(result, 'first_coin'), 'first_coin should be unlocked');
});

test('first_coin: Not unlocked at 99 gold', () => {
  const state = createMockState({ gold: 99 });
  const result = trackAchievements(state);
  assert(!isUnlocked(result, 'first_coin'), 'first_coin should not be unlocked');
});

test('wealthy: Unlock at 500 gold', () => {
  const state = createMockState({ gold: 500 });
  const result = trackAchievements(state);
  assert(isUnlocked(result, 'wealthy'), 'wealthy should be unlocked');
});

test('tycoon: Unlock at 2000 gold', () => {
  const state = createMockState({ gold: 2000 });
  const result = trackAchievements(state);
  assert(isUnlocked(result, 'tycoon'), 'tycoon should be unlocked');
});

test('rare_collector: Unlock with rare item in inventory', () => {
  const state = createMockState({ inventory: [{ rarity: 'rare' }] });
  const result = trackAchievements(state);
  assert(isUnlocked(result, 'rare_collector'), 'rare_collector should be unlocked');
});

test('rare_collector: Not unlocked without rare items', () => {
  const state = createMockState({ inventory: [{ rarity: 'common' }] });
  const result = trackAchievements(state);
  assert(!isUnlocked(result, 'rare_collector'), 'rare_collector should not be unlocked');
});

test('epic_collector: Unlock with epic item in inventory', () => {
  const state = createMockState({ inventory: [{ rarity: 'epic' }] });
  const result = trackAchievements(state);
  assert(isUnlocked(result, 'epic_collector'), 'epic_collector should be unlocked');
});

test('merchant: Unlock with 5 shop purchases', () => {
  const state = createMockState({ shopPurchases: 5 });
  const result = trackAchievements(state);
  assert(isUnlocked(result, 'merchant'), 'merchant should be unlocked');
});

test('shopaholic: Unlock with 20 shop purchases', () => {
  const state = createMockState({ shopPurchases: 20 });
  const result = trackAchievements(state);
  assert(isUnlocked(result, 'shopaholic'), 'shopaholic should be unlocked');
});

test('high_roller: Unlock at tavern streak 3', () => {
  const state = createMockState({ gameStats: { highestTavernStreak: 3 } });
  const result = trackAchievements(state);
  assert(isUnlocked(result, 'high_roller'), 'high_roller should be unlocked');
});

test('high_roller: Not unlocked at tavern streak 2', () => {
  const state = createMockState({ gameStats: { highestTavernStreak: 2 } });
  const result = trackAchievements(state);
  assert(!isUnlocked(result, 'high_roller'), 'high_roller should not be unlocked');
});

test('house_always_wins: Unlock with 1 tavern bust', () => {
  const state = createMockState({ gameStats: { tavernBusts: 1 } });
  const result = trackAchievements(state);
  assert(isUnlocked(result, 'house_always_wins'), 'house_always_wins should be unlocked');
});

test('house_always_wins: Not unlocked with 0 tavern busts', () => {
  const state = createMockState({ gameStats: { tavernBusts: 0 } });
  const result = trackAchievements(state);
  assert(!isUnlocked(result, 'house_always_wins'), 'house_always_wins should not be unlocked');
});

// === QUEST ACHIEVEMENTS ===
test('quest_starter: Unlock on first quest accepted', () => {
  const state = createMockState({ quests: [{ id: 'q1' }] });
  const result = trackAchievements(state);
  assert(isUnlocked(result, 'quest_starter'), 'quest_starter should be unlocked');
});

test('quest_seeker: Unlock with 3 completed quests', () => {
  const state = createMockState({ completedQuests: ['q1', 'q2', 'q3'] });
  const result = trackAchievements(state);
  assert(isUnlocked(result, 'quest_seeker'), 'quest_seeker should be unlocked');
});

test('quest_master: Unlock with 10 completed quests', () => {
  const state = createMockState({ completedQuests: Array.from({length: 10}, (_, i) => `q${i}`) });
  const result = trackAchievements(state);
  assert(isUnlocked(result, 'quest_master'), 'quest_master should be unlocked');
});

// === PROGRESS TRACKING ===
test('getProgress: Returns correct progress for veteran (7/10)', () => {
  const state = createMockState({ kills: 7 });
  const result = trackAchievements(state);
  const progress = getProgress(result, 'veteran');
  assert.strictEqual(progress, 7, 'Progress should be 7');
});

test('getProgress: Returns 0 for undefined achievement', () => {
  const state = createMockState();
  const result = trackAchievements(state);
  const progress = getProgress(result, 'nonexistent');
  assert.strictEqual(progress, 0, 'Progress should be 0 for nonexistent achievement');
});

// === CATEGORY FILTERING ===
test('getAchievementsByCategory: Returns combat achievements', () => {
  const achievements = getAchievementsByCategory('combat');
  assert(achievements.length > 0, 'Should return combat achievements');
  assert(achievements.every(a => a.category === 'combat'), 'All should be combat category');
});

test('getAchievementsByCategory: Returns exploration achievements', () => {
  const achievements = getAchievementsByCategory('exploration');
  assert(achievements.length === 4, 'Should return 4 exploration achievements');
});

test('getAchievementsByCategory: Returns empty for invalid category', () => {
  const achievements = getAchievementsByCategory('invalid');
  assert(achievements.length === 0, 'Should return empty array for invalid category');
});

// === ACHIEVEMENT COUNTS ===
test('getTotalCount: Matches achievement list length', () => {
  const all = getAllAchievements();
  const total = getTotalCount();
  assert(all.length > 0, 'Achievements list should not be empty');
  assert.strictEqual(total, all.length, 'Total count should match achievement list length');
});

test('getUnlockedCount: Returns correct count', () => {
  const state = createMockState({ kills: 1, gold: 100, level: 5 });
  const result = trackAchievements(state);
  const count = getUnlockedCount(result);
  assert(count === 3, 'Should have 3 unlocked achievements');
});

test('getUnlockedCount: Returns 0 for fresh state', () => {
  const state = createMockState();
  const result = trackAchievements(state);
  const count = getUnlockedCount(result);
  assert(count === 0, 'Should have 0 unlocked achievements');
});

// === EDGE CASES ===
test('Edge case: Negative values do not unlock achievements', () => {
  const state = createMockState({ kills: -10, gold: -100 });
  const result = trackAchievements(state);
  assert(!isUnlocked(result, 'first_blood'), 'Negative kills should not unlock');
  assert(!isUnlocked(result, 'first_coin'), 'Negative gold should not unlock');
});

test('Edge case: Undefined state properties default to safe values', () => {
  const state = {};
  const result = trackAchievements(state);
  assert(result.achievements !== undefined, 'Should have achievements array');
  assert(Array.isArray(result.achievements), 'Achievements should be an array');
});

test('Edge case: Very large numbers do not break system', () => {
  const state = createMockState({ kills: 999999, gold: 999999, xp: 999999 });
  const result = trackAchievements(state);
  assert(isUnlocked(result, 'legend'), 'Should handle large kill counts');
  assert(isUnlocked(result, 'tycoon'), 'Should handle large gold amounts');
});

test('Persistence: Previously unlocked achievements remain unlocked', () => {
  const state = createMockState({ 
    kills: 0,
    achievements: ['first_blood', 'veteran'] 
  });
  const result = trackAchievements(state);
  assert(isUnlocked(result, 'first_blood'), 'Previously unlocked should persist');
  assert(isUnlocked(result, 'veteran'), 'Previously unlocked should persist');
});

// === INTEGRATION TESTS ===
test('Integration: Multiple achievements unlock simultaneously', () => {
  const state = createMockState({ 
    kills: 100,
    gold: 2000,
    level: 20,
    explored: Array.from({length: 30}, (_, i) => `r${i}`),
    completedQuests: Array.from({length: 10}, (_, i) => `q${i}`)
  });
  const result = trackAchievements(state);
  assert(isUnlocked(result, 'legend'), 'legend should be unlocked');
  assert(isUnlocked(result, 'tycoon'), 'tycoon should be unlocked');
  assert(isUnlocked(result, 'master'), 'master should be unlocked');
  assert(isUnlocked(result, 'cartographer'), 'cartographer should be unlocked');
  assert(isUnlocked(result, 'quest_master'), 'quest_master should be unlocked');
});

test('getAllAchievements: Returns complete achievement list', () => {
  const all = getAllAchievements();
  const baselineIds = ['first_blood', 'veteran', 'slayer', 'legend', 'perfect_combat', 'first_steps', 'apprentice', 'first_coin'];
  assert(all.length > 0, 'Should return at least one achievement');
  assert(baselineIds.every(id => all.some(a => a.id === id)), 'Should include baseline achievements used in tests');
  assert(all.every(a => a.id && a.name && a.description), 'All should have required fields');
});

// === ADDITIONAL ACHIEVEMENT COVERAGE ===
test('pacifist_floor_5: Unlocks at floor 5 with no kills and locks with kills', () => {
  const unlockState = createMockState({
    currentFloor: 5,
    floor: 5,
    kills: 0,
    enemiesKilled: 0,
    gameStats: { enemiesDefeated: 0 }
  });
  const unlockedResult = trackAchievements(unlockState);
  assert(isUnlocked(unlockedResult, 'pacifist_floor_5'), 'pacifist_floor_5 should be unlocked at floor 5 with no kills');

  const lockedState = createMockState({
    currentFloor: 5,
    floor: 5,
    kills: 1,
    enemiesKilled: 1,
    gameStats: { enemiesDefeated: 1 }
  });
  const lockedResult = trackAchievements(lockedState);
  assert(!isUnlocked(lockedResult, 'pacifist_floor_5'), 'pacifist_floor_5 should remain locked when a kill occurs');
});

test('pacifist_floor_10: Unlocks at floor 10 with no kills', () => {
  const state = createMockState({
    currentFloor: 10,
    floor: 10,
    kills: 0,
    enemiesKilled: 0,
    gameStats: { enemiesDefeated: 0 }
  });
  const result = trackAchievements(state);
  assert(isUnlocked(result, 'pacifist_floor_10'), 'pacifist_floor_10 should be unlocked at floor 10 with no kills');
});

test('low_kill_victory: Unlocks below 20 kills and locks at 20 or more', () => {
  const unlockState = createMockState({
    victory: true,
    kills: 15,
    enemiesKilled: 15,
    gameStats: { enemiesDefeated: 15 }
  });
  const unlockedResult = trackAchievements(unlockState);
  assert(isUnlocked(unlockedResult, 'low_kill_victory'), 'low_kill_victory should unlock with victory and fewer than 20 kills');

  const lockedState = createMockState({
    victory: true,
    kills: 25,
    enemiesKilled: 25,
    gameStats: { enemiesDefeated: 25 }
  });
  const lockedResult = trackAchievements(lockedState);
  assert(!isUnlocked(lockedResult, 'low_kill_victory'), 'low_kill_victory should remain locked at 20 or more kills');
});

test('bestiary_complete: Unlocks with all known enemies', () => {
  const bestiaryIds = [
    'slime',
    'goblin',
    'goblin_chief',
    'cave_bat',
    'giant_spider',
    'wolf',
    'skeleton',
    'orc',
    'fire-spirit',
    'ice-spirit',
    'dark-cultist',
    'giant-spider',
    'bandit',
    'wraith',
    'stone-golem',
    'thunder-hawk',
    'dragon',
    'frost-revenant',
    'blood-fiend',
    'shadow-weaver',
    'storm-elemental',
    'plague-bearer',
    'infernal-knight',
    'glacial-wyrm',
    'void-stalker',
    'abyss_overlord',
    'crystal-sentinel',
    'ember-drake',
    'phantom-assassin',
    'arcane-guardian',
    'crimson-berserker',
    'frost-archon',
    'void-knight',
    'thunder-titan',
    'infernal-sorcerer',
    'abyssal-warden',
    'celestial-wyrm',
    'chaos-spawn',
    'eternal-guardian',
    'primordial-phoenix',
    'oblivion-lord'
  ];
  const bestiaryMap = Object.fromEntries(bestiaryIds.map(id => [id, true]));
  const state = createMockState({
    bestiary: bestiaryIds,
    gameStats: { bestiary: bestiaryMap }
  });
  const result = trackAchievements(state);
  assert.strictEqual(bestiaryIds.length, 41, 'Test uses 41 enemy IDs spanning slime to oblivion-lord');
  assert(bestiaryIds.every(id => ENEMIES[id]), 'All bestiary IDs should exist in the enemy data');
  assert(isUnlocked(result, 'bestiary_complete'), 'bestiary_complete should unlock when all enemies are discovered');
});

test('recipe_master: Unlocks with all known recipes', () => {
  const recipeIds = Array.from({ length: 34 }, (_, i) => `recipe_${i + 1}`);
  const state = createMockState({
    knownRecipes: recipeIds,
    crafting: { knownRecipes: recipeIds }
  });
  const result = trackAchievements(state);
  assert.strictEqual(recipeIds.length, 34, 'Test uses 34 recipe IDs');
  assert(isUnlocked(result, 'recipe_master'), 'recipe_master should unlock when all recipes are known');
});

test('equipment_collector: Unlocks with 25 unique equipment types', () => {
  const equipmentTypes = Array.from({ length: 25 }, (_, i) => `equipment_type_${i + 1}`);
  const state = createMockState({
    uniqueEquipmentFound: new Set(equipmentTypes),
    gameStats: { uniqueEquipmentFound: equipmentTypes.length }
  });
  const result = trackAchievements(state);
  assert(isUnlocked(result, 'equipment_collector'), 'equipment_collector should unlock with 25 equipment types found');
});

test('speed_runner: Unlocks under 60 minutes and locks above it', () => {
  const unlockState = createMockState({
    victory: true,
    playTimeSeconds: 3500,
    playTime: 3500 * 1000
  });
  const unlockedResult = trackAchievements(unlockState);
  assert(isUnlocked(unlockedResult, 'speed_runner'), 'speed_runner should unlock with victory under 60 minutes');

  const lockedState = createMockState({
    victory: true,
    playTimeSeconds: 3700,
    playTime: 3700 * 1000
  });
  const lockedResult = trackAchievements(lockedState);
  assert(!isUnlocked(lockedResult, 'speed_runner'), 'speed_runner should remain locked at or above 60 minutes');
});

test('speed_demon: Unlocks under 30 minutes', () => {
  const state = createMockState({
    victory: true,
    playTimeSeconds: 1700,
    playTime: 1700 * 1000
  });
  const result = trackAchievements(state);
  assert(isUnlocked(result, 'speed_demon'), 'speed_demon should unlock with victory under 30 minutes');
});

// === SUMMARY ===
console.log(`\n${'='.repeat(50)}`);
console.log(`Test Results: ${passed} passed, ${failed} failed`);
console.log(`${'='.repeat(50)}`);

if (failed > 0) {
  process.exit(1);
}
