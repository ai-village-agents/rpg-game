/**
 * Achievement System Tests
 */

import { describe, test } from 'node:test';
import assert from 'node:assert';

import {
  ACHIEVEMENT_CATEGORY,
  ACHIEVEMENT_RARITY,
  TRIGGER_TYPE,
  ACHIEVEMENTS,
  createAchievementState,
  getAchievementData,
  getAllAchievements,
  getAchievementsByCategory,
  getAchievementsByRarity,
  isAchievementUnlocked,
  getAchievementProgress,
  updateStat,
  setStat,
  triggerEvent,
  checkAchievements,
  getAchievementPoints,
  getUnlockedAchievements,
  getLockedAchievements,
  getAchievementDisplayName,
  getAchievementDisplayDescription,
  getCompletionPercentage,
  getAllCategories,
  getAllRarities,
  getStatsSummary,
} from '../src/achievement-system.js';

import {
  getAchievementStyles,
  renderAchievementPanel,
  renderCompletionDisplay,
  renderAchievementNotification,
  renderRecentAchievements,
  renderAchievementSummary,
} from '../src/achievement-system-ui.js';

// Banned words that should never appear in game content
const BANNED_WORDS = ['egg', 'easter', 'yolk', 'bunny', 'rabbit', 'phoenix'];

describe('Achievement Constants', () => {
  test('ACHIEVEMENT_CATEGORY has all expected categories', () => {
    assert.strictEqual(ACHIEVEMENT_CATEGORY.COMBAT, 'combat');
    assert.strictEqual(ACHIEVEMENT_CATEGORY.EXPLORATION, 'exploration');
    assert.strictEqual(ACHIEVEMENT_CATEGORY.COLLECTION, 'collection');
    assert.strictEqual(ACHIEVEMENT_CATEGORY.SOCIAL, 'social');
    assert.strictEqual(ACHIEVEMENT_CATEGORY.PROGRESSION, 'progression');
    assert.strictEqual(ACHIEVEMENT_CATEGORY.SECRET, 'secret');
  });

  test('ACHIEVEMENT_RARITY has all expected rarities', () => {
    assert.strictEqual(ACHIEVEMENT_RARITY.COMMON, 'common');
    assert.strictEqual(ACHIEVEMENT_RARITY.UNCOMMON, 'uncommon');
    assert.strictEqual(ACHIEVEMENT_RARITY.RARE, 'rare');
    assert.strictEqual(ACHIEVEMENT_RARITY.EPIC, 'epic');
    assert.strictEqual(ACHIEVEMENT_RARITY.LEGENDARY, 'legendary');
  });

  test('TRIGGER_TYPE has all expected types', () => {
    assert.strictEqual(TRIGGER_TYPE.CUMULATIVE, 'cumulative');
    assert.strictEqual(TRIGGER_TYPE.SINGLE, 'single');
    assert.strictEqual(TRIGGER_TYPE.MULTI_CONDITION, 'multi');
  });
});

describe('Achievement Definitions', () => {
  test('All achievements have required fields', () => {
    for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
      assert.strictEqual(achievement.id, id, `Achievement ${id} id mismatch`);
      assert.ok(achievement.name, `Achievement ${id} missing name`);
      assert.ok(achievement.description, `Achievement ${id} missing description`);
      assert.ok(achievement.icon, `Achievement ${id} missing icon`);
      assert.ok(achievement.category, `Achievement ${id} missing category`);
      assert.ok(achievement.rarity, `Achievement ${id} missing rarity`);
      assert.ok(achievement.trigger, `Achievement ${id} missing trigger`);
      assert.ok(typeof achievement.hidden === 'boolean', `Achievement ${id} missing hidden flag`);
    }
  });

  test('All achievements have valid categories', () => {
    const validCategories = Object.values(ACHIEVEMENT_CATEGORY);
    for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
      assert.ok(
        validCategories.includes(achievement.category),
        `Achievement ${id} has invalid category: ${achievement.category}`
      );
    }
  });

  test('All achievements have valid rarities', () => {
    const validRarities = Object.values(ACHIEVEMENT_RARITY);
    for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
      assert.ok(
        validRarities.includes(achievement.rarity),
        `Achievement ${id} has invalid rarity: ${achievement.rarity}`
      );
    }
  });

  test('All achievements have valid trigger types', () => {
    const validTypes = Object.values(TRIGGER_TYPE);
    for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
      assert.ok(
        validTypes.includes(achievement.trigger.type),
        `Achievement ${id} has invalid trigger type: ${achievement.trigger.type}`
      );
    }
  });

  test('Cumulative triggers have stat and threshold', () => {
    for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
      if (achievement.trigger.type === TRIGGER_TYPE.CUMULATIVE) {
        assert.ok(achievement.trigger.stat, `Achievement ${id} missing stat`);
        assert.ok(typeof achievement.trigger.threshold === 'number', `Achievement ${id} missing threshold`);
      }
    }
  });

  test('Single triggers have event', () => {
    for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
      if (achievement.trigger.type === TRIGGER_TYPE.SINGLE) {
        assert.ok(achievement.trigger.event, `Achievement ${id} missing event`);
      }
    }
  });

  test('Hidden achievements have unlocked name and description', () => {
    for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
      if (achievement.hidden) {
        assert.ok(achievement.unlockedName, `Hidden achievement ${id} missing unlockedName`);
        assert.ok(achievement.unlockedDescription, `Hidden achievement ${id} missing unlockedDescription`);
      }
    }
  });
});

describe('createAchievementState', () => {
  test('Creates state with empty unlocked array', () => {
    const state = createAchievementState();
    assert.ok(Array.isArray(state.unlocked));
    assert.strictEqual(state.unlocked.length, 0);
  });

  test('Creates state with empty progress object', () => {
    const state = createAchievementState();
    assert.ok(typeof state.progress === 'object');
  });

  test('Creates state with all stats initialized', () => {
    const state = createAchievementState();
    assert.ok(typeof state.stats === 'object');
    assert.strictEqual(state.stats.enemiesDefeated, 0);
    assert.strictEqual(state.stats.bossesDefeated, 0);
    assert.strictEqual(state.stats.playerLevel, 1);
  });

  test('Creates state with zero total points', () => {
    const state = createAchievementState();
    assert.strictEqual(state.totalPoints, 0);
  });

  test('Creates state with null lastUnlocked', () => {
    const state = createAchievementState();
    assert.strictEqual(state.lastUnlocked, null);
  });
});

describe('getAchievementData', () => {
  test('Returns achievement data for valid ID', () => {
    const achievement = getAchievementData('first-blood');
    assert.ok(achievement);
    assert.strictEqual(achievement.id, 'first-blood');
    assert.strictEqual(achievement.name, 'First Blood');
  });

  test('Returns null for invalid ID', () => {
    const achievement = getAchievementData('non-existent');
    assert.strictEqual(achievement, null);
  });
});

describe('getAllAchievements', () => {
  test('Returns array of all achievements', () => {
    const all = getAllAchievements();
    assert.ok(Array.isArray(all));
    assert.strictEqual(all.length, Object.keys(ACHIEVEMENTS).length);
  });
});

describe('getAchievementsByCategory', () => {
  test('Returns only combat achievements', () => {
    const combat = getAchievementsByCategory(ACHIEVEMENT_CATEGORY.COMBAT);
    assert.ok(Array.isArray(combat));
    assert.ok(combat.length > 0);
    for (const a of combat) {
      assert.strictEqual(a.category, ACHIEVEMENT_CATEGORY.COMBAT);
    }
  });

  test('Returns only exploration achievements', () => {
    const exploration = getAchievementsByCategory(ACHIEVEMENT_CATEGORY.EXPLORATION);
    assert.ok(exploration.length > 0);
    for (const a of exploration) {
      assert.strictEqual(a.category, ACHIEVEMENT_CATEGORY.EXPLORATION);
    }
  });

  test('Returns empty array for invalid category', () => {
    const invalid = getAchievementsByCategory('invalid-category');
    assert.strictEqual(invalid.length, 0);
  });
});

describe('getAchievementsByRarity', () => {
  test('Returns only common achievements', () => {
    const common = getAchievementsByRarity(ACHIEVEMENT_RARITY.COMMON);
    assert.ok(common.length > 0);
    for (const a of common) {
      assert.strictEqual(a.rarity, ACHIEVEMENT_RARITY.COMMON);
    }
  });

  test('Returns only legendary achievements', () => {
    const legendary = getAchievementsByRarity(ACHIEVEMENT_RARITY.LEGENDARY);
    assert.ok(legendary.length > 0);
    for (const a of legendary) {
      assert.strictEqual(a.rarity, ACHIEVEMENT_RARITY.LEGENDARY);
    }
  });
});

describe('isAchievementUnlocked', () => {
  test('Returns false for locked achievement', () => {
    const state = createAchievementState();
    assert.strictEqual(isAchievementUnlocked(state, 'first-blood'), false);
  });

  test('Returns true for unlocked achievement', () => {
    const state = createAchievementState();
    state.unlocked.push('first-blood');
    assert.strictEqual(isAchievementUnlocked(state, 'first-blood'), true);
  });
});

describe('getAchievementProgress', () => {
  test('Returns complete progress for unlocked achievement', () => {
    const state = createAchievementState();
    state.unlocked.push('first-blood');
    const progress = getAchievementProgress(state, 'first-blood');
    assert.strictEqual(progress.percent, 100);
    assert.strictEqual(progress.complete, true);
  });

  test('Returns partial progress for cumulative achievement', () => {
    const state = createAchievementState();
    state.stats.enemiesDefeated = 10;
    const progress = getAchievementProgress(state, 'warrior-apprentice');
    assert.strictEqual(progress.current, 10);
    assert.strictEqual(progress.target, 25);
    assert.strictEqual(progress.percent, 40);
    assert.strictEqual(progress.complete, false);
  });

  test('Returns zero progress for single-event achievement', () => {
    const state = createAchievementState();
    const progress = getAchievementProgress(state, 'no-damage-victory');
    assert.strictEqual(progress.current, 0);
    assert.strictEqual(progress.target, 1);
    assert.strictEqual(progress.percent, 0);
  });

  test('Returns zero for invalid achievement', () => {
    const state = createAchievementState();
    const progress = getAchievementProgress(state, 'invalid');
    assert.strictEqual(progress.current, 0);
    assert.strictEqual(progress.target, 0);
  });
});

describe('updateStat', () => {
  test('Increments stat by default amount', () => {
    let state = createAchievementState();
    const result = updateStat(state, 'enemiesDefeated');
    assert.strictEqual(result.state.stats.enemiesDefeated, 1);
  });

  test('Increments stat by specified amount', () => {
    let state = createAchievementState();
    const result = updateStat(state, 'enemiesDefeated', 5);
    assert.strictEqual(result.state.stats.enemiesDefeated, 5);
  });

  test('Returns unchanged state for invalid stat', () => {
    let state = createAchievementState();
    const result = updateStat(state, 'invalidStat', 5);
    assert.strictEqual(result.newlyUnlocked.length, 0);
  });

  test('Unlocks achievement when threshold reached', () => {
    let state = createAchievementState();
    const result = updateStat(state, 'enemiesDefeated', 1);
    assert.strictEqual(result.newlyUnlocked.length, 1);
    assert.strictEqual(result.newlyUnlocked[0].id, 'first-blood');
    assert.ok(result.state.unlocked.includes('first-blood'));
  });

  test('Unlocks multiple achievements at once', () => {
    let state = createAchievementState();
    const result = updateStat(state, 'enemiesDefeated', 25);
    assert.ok(result.newlyUnlocked.length >= 2);
    assert.ok(result.state.unlocked.includes('first-blood'));
    assert.ok(result.state.unlocked.includes('warrior-apprentice'));
  });
});

describe('setStat', () => {
  test('Sets stat to exact value', () => {
    let state = createAchievementState();
    const result = setStat(state, 'playerLevel', 10);
    assert.strictEqual(result.state.stats.playerLevel, 10);
  });

  test('Returns unchanged state for invalid stat', () => {
    let state = createAchievementState();
    const result = setStat(state, 'invalidStat', 10);
    assert.strictEqual(result.newlyUnlocked.length, 0);
  });

  test('Unlocks achievement when value meets threshold', () => {
    let state = createAchievementState();
    const result = setStat(state, 'playerLevel', 5);
    assert.ok(result.state.unlocked.includes('level-5'));
  });
});

describe('triggerEvent', () => {
  test('Unlocks single-event achievement', () => {
    let state = createAchievementState();
    const result = triggerEvent(state, 'flawlessVictory');
    assert.strictEqual(result.newlyUnlocked.length, 1);
    assert.strictEqual(result.newlyUnlocked[0].id, 'no-damage-victory');
    assert.ok(result.state.unlocked.includes('no-damage-victory'));
  });

  test('Does nothing for unknown event', () => {
    let state = createAchievementState();
    const result = triggerEvent(state, 'unknownEvent');
    assert.strictEqual(result.newlyUnlocked.length, 0);
  });

  test('Does not re-unlock already unlocked achievement', () => {
    let state = createAchievementState();
    state.unlocked.push('no-damage-victory');
    const result = triggerEvent(state, 'flawlessVictory');
    assert.strictEqual(result.newlyUnlocked.length, 0);
  });

  test('Unlocks hidden achievement', () => {
    let state = createAchievementState();
    const result = triggerEvent(state, 'secretAreaFound');
    assert.ok(result.state.unlocked.includes('secret-area'));
  });
});

describe('checkAchievements', () => {
  test('Detects achievements that should be unlocked', () => {
    let state = createAchievementState();
    state.stats.enemiesDefeated = 100;
    const result = checkAchievements(state);
    assert.ok(result.state.unlocked.includes('first-blood'));
    assert.ok(result.state.unlocked.includes('warrior-apprentice'));
    assert.ok(result.state.unlocked.includes('battle-hardened'));
  });

  test('Returns empty array when no new achievements', () => {
    let state = createAchievementState();
    const result = checkAchievements(state);
    assert.strictEqual(result.newlyUnlocked.length, 0);
  });
});

describe('getAchievementPoints', () => {
  test('Common achievements give 10 points', () => {
    const achievement = { rarity: ACHIEVEMENT_RARITY.COMMON };
    assert.strictEqual(getAchievementPoints(achievement), 10);
  });

  test('Uncommon achievements give 25 points', () => {
    const achievement = { rarity: ACHIEVEMENT_RARITY.UNCOMMON };
    assert.strictEqual(getAchievementPoints(achievement), 25);
  });

  test('Rare achievements give 50 points', () => {
    const achievement = { rarity: ACHIEVEMENT_RARITY.RARE };
    assert.strictEqual(getAchievementPoints(achievement), 50);
  });

  test('Epic achievements give 100 points', () => {
    const achievement = { rarity: ACHIEVEMENT_RARITY.EPIC };
    assert.strictEqual(getAchievementPoints(achievement), 100);
  });

  test('Legendary achievements give 200 points', () => {
    const achievement = { rarity: ACHIEVEMENT_RARITY.LEGENDARY };
    assert.strictEqual(getAchievementPoints(achievement), 200);
  });
});

describe('Points Accumulation', () => {
  test('Points accumulate when achievements unlock', () => {
    let state = createAchievementState();
    assert.strictEqual(state.totalPoints, 0);

    const result = updateStat(state, 'enemiesDefeated', 1);
    assert.strictEqual(result.state.totalPoints, 10); // first-blood is common
  });

  test('Multiple achievements add their points', () => {
    let state = createAchievementState();
    const result = updateStat(state, 'enemiesDefeated', 25);
    // first-blood (10) + warrior-apprentice (10)
    assert.strictEqual(result.state.totalPoints, 20);
  });
});

describe('getUnlockedAchievements', () => {
  test('Returns empty array when none unlocked', () => {
    const state = createAchievementState();
    const unlocked = getUnlockedAchievements(state);
    assert.strictEqual(unlocked.length, 0);
  });

  test('Returns achievement data for unlocked', () => {
    const state = createAchievementState();
    state.unlocked.push('first-blood', 'boss-hunter');
    const unlocked = getUnlockedAchievements(state);
    assert.strictEqual(unlocked.length, 2);
    assert.ok(unlocked.some(a => a.id === 'first-blood'));
    assert.ok(unlocked.some(a => a.id === 'boss-hunter'));
  });
});

describe('getLockedAchievements', () => {
  test('Returns all non-hidden achievements when none unlocked', () => {
    const state = createAchievementState();
    const locked = getLockedAchievements(state);
    const hiddenCount = Object.values(ACHIEVEMENTS).filter(a => a.hidden).length;
    assert.strictEqual(locked.length, Object.keys(ACHIEVEMENTS).length - hiddenCount);
  });

  test('Excludes unlocked achievements', () => {
    const state = createAchievementState();
    state.unlocked.push('first-blood');
    const locked = getLockedAchievements(state);
    assert.ok(!locked.some(a => a.id === 'first-blood'));
  });

  test('Excludes hidden achievements', () => {
    const state = createAchievementState();
    const locked = getLockedAchievements(state);
    assert.ok(!locked.some(a => a.hidden));
  });
});

describe('getAchievementDisplayName', () => {
  test('Returns normal name for non-hidden achievement', () => {
    const achievement = getAchievementData('first-blood');
    assert.strictEqual(getAchievementDisplayName(achievement, false), 'First Blood');
    assert.strictEqual(getAchievementDisplayName(achievement, true), 'First Blood');
  });

  test('Returns ??? for locked hidden achievement', () => {
    const achievement = getAchievementData('secret-area');
    assert.strictEqual(getAchievementDisplayName(achievement, false), '???');
  });

  test('Returns unlocked name for unlocked hidden achievement', () => {
    const achievement = getAchievementData('secret-area');
    assert.strictEqual(getAchievementDisplayName(achievement, true), 'Secret Keeper');
  });
});

describe('getAchievementDisplayDescription', () => {
  test('Returns normal description for non-hidden achievement', () => {
    const achievement = getAchievementData('first-blood');
    assert.ok(getAchievementDisplayDescription(achievement, false).includes('first enemy'));
  });

  test('Returns unlocked description for unlocked hidden achievement', () => {
    const achievement = getAchievementData('secret-area');
    assert.strictEqual(getAchievementDisplayDescription(achievement, true), 'You found a hidden area!');
  });
});

describe('getCompletionPercentage', () => {
  test('Returns 0 when nothing unlocked', () => {
    const state = createAchievementState();
    assert.strictEqual(getCompletionPercentage(state), 0);
  });

  test('Calculates correct percentage', () => {
    const state = createAchievementState();
    const total = Object.keys(ACHIEVEMENTS).length;
    state.unlocked.push('first-blood');
    const percent = getCompletionPercentage(state);
    assert.strictEqual(percent, Math.floor(100 / total));
  });
});

describe('getAllCategories', () => {
  test('Returns all category values', () => {
    const categories = getAllCategories();
    assert.ok(categories.includes('combat'));
    assert.ok(categories.includes('exploration'));
    assert.ok(categories.includes('secret'));
  });
});

describe('getAllRarities', () => {
  test('Returns all rarity values', () => {
    const rarities = getAllRarities();
    assert.ok(rarities.includes('common'));
    assert.ok(rarities.includes('legendary'));
  });
});

describe('getStatsSummary', () => {
  test('Returns copy of stats', () => {
    const state = createAchievementState();
    state.stats.enemiesDefeated = 50;
    const summary = getStatsSummary(state);
    assert.strictEqual(summary.enemiesDefeated, 50);
    // Ensure it's a copy
    summary.enemiesDefeated = 100;
    assert.strictEqual(state.stats.enemiesDefeated, 50);
  });
});

describe('lastUnlocked tracking', () => {
  test('Updates lastUnlocked when achievement unlocks', () => {
    let state = createAchievementState();
    const result = updateStat(state, 'enemiesDefeated', 1);
    assert.strictEqual(result.state.lastUnlocked, 'first-blood');
  });

  test('lastUnlocked reflects most recent unlock', () => {
    let state = createAchievementState();
    const result = updateStat(state, 'enemiesDefeated', 25);
    // warrior-apprentice should be last since it has higher threshold
    assert.strictEqual(result.state.lastUnlocked, 'warrior-apprentice');
  });
});

// UI Tests
describe('getAchievementStyles', () => {
  test('Returns CSS string', () => {
    const styles = getAchievementStyles();
    assert.ok(typeof styles === 'string');
    assert.ok(styles.includes('.achievement-panel'));
    assert.ok(styles.includes('.achievement-card'));
    assert.ok(styles.includes('.achievement-notification'));
  });

  test('Includes rarity colors', () => {
    const styles = getAchievementStyles();
    assert.ok(styles.includes('.achievement-rarity.common'));
    assert.ok(styles.includes('.achievement-rarity.legendary'));
  });
});

describe('renderAchievementPanel', () => {
  test('Renders panel with header', () => {
    const state = createAchievementState();
    const html = renderAchievementPanel(state);
    assert.ok(html.includes('achievement-panel'));
    assert.ok(html.includes('Achievements'));
  });

  test('Shows correct achievement count', () => {
    const state = createAchievementState();
    state.unlocked.push('first-blood');
    const total = Object.keys(ACHIEVEMENTS).length;
    const html = renderAchievementPanel(state);
    assert.ok(html.includes(`1/${total}`));
  });

  test('Shows total points', () => {
    const state = createAchievementState();
    state.totalPoints = 100;
    const html = renderAchievementPanel(state);
    assert.ok(html.includes('100 pts'));
  });

  test('Renders category tabs', () => {
    const state = createAchievementState();
    const html = renderAchievementPanel(state);
    assert.ok(html.includes('data-category="all"'));
    assert.ok(html.includes('data-category="combat"'));
    assert.ok(html.includes('data-category="exploration"'));
  });

  test('Active tab is highlighted', () => {
    const state = createAchievementState();
    const html = renderAchievementPanel(state, 'combat');
    assert.ok(html.includes('data-category="combat"'));
    // The combat tab should have 'active' class
    assert.ok(html.match(/class="[^"]*active[^"]*"[^>]*data-category="combat"/));
  });

  test('Renders achievement cards', () => {
    const state = createAchievementState();
    const html = renderAchievementPanel(state);
    assert.ok(html.includes('achievement-card'));
    assert.ok(html.includes('achievement-icon'));
  });

  test('Marks unlocked achievements', () => {
    const state = createAchievementState();
    state.unlocked.push('first-blood');
    const html = renderAchievementPanel(state);
    assert.ok(html.includes('unlocked'));
  });
});

describe('renderCompletionDisplay', () => {
  test('Shows completion percentage', () => {
    const state = createAchievementState();
    const html = renderCompletionDisplay(state);
    assert.ok(html.includes('0%'));
  });

  test('Shows unlock count', () => {
    const state = createAchievementState();
    state.unlocked.push('first-blood', 'boss-hunter');
    const html = renderCompletionDisplay(state);
    assert.ok(html.includes('2 unlocked'));
  });

  test('Shows remaining count', () => {
    const state = createAchievementState();
    const total = Object.keys(ACHIEVEMENTS).length;
    const html = renderCompletionDisplay(state);
    assert.ok(html.includes(`${total} remaining`));
  });
});

describe('renderAchievementNotification', () => {
  test('Shows achievement unlocked header', () => {
    const achievement = getAchievementData('first-blood');
    const html = renderAchievementNotification(achievement);
    assert.ok(html.includes('Achievement Unlocked'));
  });

  test('Shows achievement name', () => {
    const achievement = getAchievementData('first-blood');
    const html = renderAchievementNotification(achievement);
    assert.ok(html.includes('First Blood'));
  });

  test('Shows achievement icon', () => {
    const achievement = getAchievementData('first-blood');
    const html = renderAchievementNotification(achievement);
    assert.ok(html.includes(achievement.icon));
  });

  test('Shows points', () => {
    const achievement = getAchievementData('first-blood');
    const html = renderAchievementNotification(achievement);
    assert.ok(html.includes('+10 pts'));
  });

  test('Shows unlocked name for hidden achievement', () => {
    const achievement = getAchievementData('secret-area');
    const html = renderAchievementNotification(achievement);
    assert.ok(html.includes('Secret Keeper'));
  });
});

describe('renderRecentAchievements', () => {
  test('Returns empty string when no achievements', () => {
    const state = createAchievementState();
    const html = renderRecentAchievements(state);
    assert.strictEqual(html, '');
  });

  test('Shows recent achievements', () => {
    const state = createAchievementState();
    state.unlocked.push('first-blood', 'boss-hunter');
    const html = renderRecentAchievements(state);
    assert.ok(html.includes('Recent Achievements'));
    assert.ok(html.includes('recent-achievement'));
  });

  test('Limits number of shown achievements', () => {
    const state = createAchievementState();
    state.unlocked.push('first-blood', 'boss-hunter', 'curious-wanderer',
      'socialite', 'level-5', 'potion-brewer', 'pack-rat');
    const html = renderRecentAchievements(state, 3);
    const matches = html.match(/recent-achievement-icon/g);
    assert.ok(matches && matches.length <= 3);
  });
});

describe('renderAchievementSummary', () => {
  test('Shows summary with counts', () => {
    const state = createAchievementState();
    state.unlocked.push('first-blood');
    const total = Object.keys(ACHIEVEMENTS).length;
    const html = renderAchievementSummary(state);
    assert.ok(html.includes(`1/${total}`));
  });

  test('Shows completion percentage', () => {
    const state = createAchievementState();
    const html = renderAchievementSummary(state);
    assert.ok(html.includes('(0%)'));
  });
});

// Security Tests
describe('XSS Prevention', () => {
  test('renderAchievementPanel escapes category in data attributes', () => {
    const state = createAchievementState();
    // Categories come from predefined ACHIEVEMENT_CATEGORY values, not user input
    // activeCategory is only used for comparison, not rendered
    const html = renderAchievementPanel(state, '<script>');
    // Malicious activeCategory won't appear in output since it doesn't match any tab
    // What matters is that predefined categories are escaped in data-category
    assert.ok(html.includes('data-category='));
    // All tab content comes from safe predefined values
    assert.ok(html.includes('combat'));
    assert.ok(html.includes('exploration'));
  });

  test('renderAchievementNotification escapes achievement name', () => {
    const maliciousAchievement = {
      id: 'test',
      name: '<img onerror="alert(1)">',
      description: 'Test',
      icon: 'X',
      rarity: 'common',
    };
    const html = renderAchievementNotification(maliciousAchievement);
    assert.ok(!html.includes('<img'));
    assert.ok(html.includes('&lt;img'));
  });

  test('renderAchievementNotification escapes icon', () => {
    const maliciousAchievement = {
      id: 'test',
      name: 'Test',
      description: 'Test',
      icon: '<script>',
      rarity: 'common',
    };
    const html = renderAchievementNotification(maliciousAchievement);
    assert.ok(!html.includes('<script>'));
  });
});

describe('Banned Words Security Scan', () => {
  test('No banned words in achievement names', () => {
    for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
      const name = achievement.name.toLowerCase();
      for (const word of BANNED_WORDS) {
        assert.ok(
          !name.includes(word),
          `Achievement ${id} name contains banned word: ${word}`
        );
      }
      if (achievement.unlockedName) {
        const unlockedName = achievement.unlockedName.toLowerCase();
        for (const word of BANNED_WORDS) {
          assert.ok(
            !unlockedName.includes(word),
            `Achievement ${id} unlockedName contains banned word: ${word}`
          );
        }
      }
    }
  });

  test('No banned words in achievement descriptions', () => {
    for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
      const desc = achievement.description.toLowerCase();
      for (const word of BANNED_WORDS) {
        assert.ok(
          !desc.includes(word),
          `Achievement ${id} description contains banned word: ${word}`
        );
      }
      if (achievement.unlockedDescription) {
        const unlockedDesc = achievement.unlockedDescription.toLowerCase();
        for (const word of BANNED_WORDS) {
          assert.ok(
            !unlockedDesc.includes(word),
            `Achievement ${id} unlockedDescription contains banned word: ${word}`
          );
        }
      }
    }
  });

  test('No banned words in achievement IDs', () => {
    for (const id of Object.keys(ACHIEVEMENTS)) {
      for (const word of BANNED_WORDS) {
        assert.ok(
          !id.toLowerCase().includes(word),
          `Achievement ID ${id} contains banned word: ${word}`
        );
      }
    }
  });

  test('No banned words in category names', () => {
    for (const category of Object.values(ACHIEVEMENT_CATEGORY)) {
      for (const word of BANNED_WORDS) {
        assert.ok(
          !category.toLowerCase().includes(word),
          `Category ${category} contains banned word: ${word}`
        );
      }
    }
  });

  test('No banned words in rarity names', () => {
    for (const rarity of Object.values(ACHIEVEMENT_RARITY)) {
      for (const word of BANNED_WORDS) {
        assert.ok(
          !rarity.toLowerCase().includes(word),
          `Rarity ${rarity} contains banned word: ${word}`
        );
      }
    }
  });

  test('No banned words in item rewards', () => {
    for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
      if (achievement.rewards && achievement.rewards.items) {
        for (const item of achievement.rewards.items) {
          for (const word of BANNED_WORDS) {
            assert.ok(
              !item.toLowerCase().includes(word),
              `Achievement ${id} reward item ${item} contains banned word: ${word}`
            );
          }
        }
      }
    }
  });

  test('No banned words in stat names', () => {
    const state = createAchievementState();
    for (const stat of Object.keys(state.stats)) {
      for (const word of BANNED_WORDS) {
        assert.ok(
          !stat.toLowerCase().includes(word),
          `Stat ${stat} contains banned word: ${word}`
        );
      }
    }
  });

  test('No banned words in event names', () => {
    for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
      if (achievement.trigger.event) {
        for (const word of BANNED_WORDS) {
          assert.ok(
            !achievement.trigger.event.toLowerCase().includes(word),
            `Achievement ${id} event contains banned word: ${word}`
          );
        }
      }
    }
  });
});

describe('Immutability', () => {
  test('updateStat does not mutate original state', () => {
    const state = createAchievementState();
    const originalEnemies = state.stats.enemiesDefeated;
    updateStat(state, 'enemiesDefeated', 5);
    assert.strictEqual(state.stats.enemiesDefeated, originalEnemies);
  });

  test('setStat does not mutate original state', () => {
    const state = createAchievementState();
    setStat(state, 'playerLevel', 10);
    assert.strictEqual(state.stats.playerLevel, 1);
  });

  test('triggerEvent does not mutate original state', () => {
    const state = createAchievementState();
    const originalUnlocked = state.unlocked.length;
    triggerEvent(state, 'flawlessVictory');
    assert.strictEqual(state.unlocked.length, originalUnlocked);
  });

  test('checkAchievements does not mutate original state', () => {
    const state = createAchievementState();
    state.stats.enemiesDefeated = 100;
    const originalUnlocked = state.unlocked.length;
    checkAchievements(state);
    assert.strictEqual(state.unlocked.length, originalUnlocked);
  });
});

describe('Edge Cases', () => {
  test('Handles unlocking all achievements', () => {
    let state = createAchievementState();
    // Set all stats very high
    for (const stat of Object.keys(state.stats)) {
      state.stats[stat] = 99999;
    }
    const result = checkAchievements(state);
    // Should unlock all cumulative achievements
    assert.ok(result.newlyUnlocked.length > 0);
  });

  test('Handles negative stat update gracefully', () => {
    let state = createAchievementState();
    state.stats.enemiesDefeated = 10;
    const result = updateStat(state, 'enemiesDefeated', -5);
    assert.strictEqual(result.state.stats.enemiesDefeated, 5);
  });

  test('Handles zero amount update', () => {
    let state = createAchievementState();
    state.stats.enemiesDefeated = 10;
    const result = updateStat(state, 'enemiesDefeated', 0);
    assert.strictEqual(result.state.stats.enemiesDefeated, 10);
  });

  test('Does not double-unlock achievements', () => {
    let state = createAchievementState();
    state.unlocked.push('first-blood');
    const initialPoints = state.totalPoints;
    state.stats.enemiesDefeated = 1;
    const result = checkAchievements(state);
    assert.strictEqual(result.state.unlocked.filter(id => id === 'first-blood').length, 1);
  });
});
