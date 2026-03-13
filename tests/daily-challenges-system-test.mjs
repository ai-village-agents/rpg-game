/**
 * Daily Challenges System Tests
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  CHALLENGE_TYPES,
  CHALLENGE_DIFFICULTY,
  CHALLENGE_DURATION,
  REWARD_TYPES,
  CHALLENGE_TEMPLATES,
  TOKEN_SHOP_ITEMS,
  createChallengeState,
  generateChallenge,
  generateDailyChallenges,
  generateWeeklyChallenge,
  updateChallengeProgress,
  claimChallengeReward,
  processExpiredChallenges,
  purchaseTokenItem,
  getChallengeProgress,
  getActiveChallengesByType,
  getTodayChallenges,
  getChallengeStats,
  getTimeRemaining,
  hasClaimableRewards,
  getClaimableChallenges,
  abandonChallenge,
  getExpiringChallenges,
  areDailyChallengesComplete,
  getStreakBonus
} from '../src/daily-challenges-system.js';

import {
  TYPE_ICONS,
  DURATION_ICONS,
  renderChallengesPanel,
  renderActiveChallenges,
  renderChallengeCard,
  renderCompletedChallenges,
  renderCompletedCard,
  renderTokenShop,
  renderShopItem,
  renderChallengeStatsPanel,
  renderRewardClaimPopup,
  renderChallengeCompleteNotification,
  renderExpiringWarning,
  renderProgressNotification,
  renderStreakMilestone,
  renderMiniTracker,
  renderPurchaseConfirmation,
  renderAbandonConfirmation
} from '../src/daily-challenges-system-ui.js';

describe('Challenge Types', () => {
  it('should have all expected challenge types', () => {
    assert.strictEqual(CHALLENGE_TYPES.COMBAT, 'combat');
    assert.strictEqual(CHALLENGE_TYPES.EXPLORATION, 'exploration');
    assert.strictEqual(CHALLENGE_TYPES.COLLECTION, 'collection');
    assert.strictEqual(CHALLENGE_TYPES.CRAFTING, 'crafting');
    assert.strictEqual(CHALLENGE_TYPES.TRADING, 'trading');
    assert.strictEqual(CHALLENGE_TYPES.SOCIAL, 'social');
    assert.strictEqual(CHALLENGE_TYPES.SURVIVAL, 'survival');
    assert.strictEqual(CHALLENGE_TYPES.SPEED, 'speed');
  });

  it('should have 8 challenge types', () => {
    assert.strictEqual(Object.keys(CHALLENGE_TYPES).length, 8);
  });
});

describe('Challenge Difficulty', () => {
  it('should have all difficulty levels', () => {
    assert.ok(CHALLENGE_DIFFICULTY.EASY);
    assert.ok(CHALLENGE_DIFFICULTY.MEDIUM);
    assert.ok(CHALLENGE_DIFFICULTY.HARD);
    assert.ok(CHALLENGE_DIFFICULTY.EXTREME);
  });

  it('should have increasing multipliers', () => {
    assert.ok(CHALLENGE_DIFFICULTY.EASY.multiplier < CHALLENGE_DIFFICULTY.MEDIUM.multiplier);
    assert.ok(CHALLENGE_DIFFICULTY.MEDIUM.multiplier < CHALLENGE_DIFFICULTY.HARD.multiplier);
    assert.ok(CHALLENGE_DIFFICULTY.HARD.multiplier < CHALLENGE_DIFFICULTY.EXTREME.multiplier);
  });

  it('should have names and colors for all difficulties', () => {
    for (const diff of Object.values(CHALLENGE_DIFFICULTY)) {
      assert.ok(diff.name);
      assert.ok(diff.color);
      assert.ok(diff.multiplier > 0);
    }
  });
});

describe('Challenge Duration', () => {
  it('should have all duration types', () => {
    assert.ok(CHALLENGE_DURATION.DAILY);
    assert.ok(CHALLENGE_DURATION.WEEKLY);
    assert.ok(CHALLENGE_DURATION.WEEKEND);
    assert.ok(CHALLENGE_DURATION.EVENT);
  });

  it('should have correct hours for daily', () => {
    assert.strictEqual(CHALLENGE_DURATION.DAILY.hours, 24);
  });

  it('should have correct hours for weekly', () => {
    assert.strictEqual(CHALLENGE_DURATION.WEEKLY.hours, 168);
  });

  it('should have bonus multipliers', () => {
    for (const duration of Object.values(CHALLENGE_DURATION)) {
      assert.ok(duration.bonusMultiplier > 0);
    }
  });
});

describe('Challenge Templates', () => {
  it('should have multiple templates', () => {
    assert.ok(Object.keys(CHALLENGE_TEMPLATES).length > 10);
  });

  it('should have required properties on each template', () => {
    for (const [key, template] of Object.entries(CHALLENGE_TEMPLATES)) {
      assert.ok(template.type, `${key} missing type`);
      assert.ok(template.nameTemplate, `${key} missing nameTemplate`);
      assert.ok(template.descriptionTemplate, `${key} missing descriptionTemplate`);
      assert.ok(template.targetKey, `${key} missing targetKey`);
      assert.ok(template.baseCount > 0, `${key} missing baseCount`);
      assert.ok(template.scaleFactor > 0, `${key} missing scaleFactor`);
    }
  });

  it('should have combat templates', () => {
    const combatTemplates = Object.values(CHALLENGE_TEMPLATES).filter(t => t.type === CHALLENGE_TYPES.COMBAT);
    assert.ok(combatTemplates.length >= 3);
  });

  it('should have exploration templates', () => {
    const exploreTemplates = Object.values(CHALLENGE_TEMPLATES).filter(t => t.type === CHALLENGE_TYPES.EXPLORATION);
    assert.ok(exploreTemplates.length >= 2);
  });
});

describe('Token Shop Items', () => {
  it('should have shop items', () => {
    assert.ok(Object.keys(TOKEN_SHOP_ITEMS).length >= 5);
  });

  it('should have cost and description for each item', () => {
    for (const [key, item] of Object.entries(TOKEN_SHOP_ITEMS)) {
      assert.ok(item.name, `${key} missing name`);
      assert.ok(item.cost > 0, `${key} missing cost`);
      assert.ok(item.description, `${key} missing description`);
    }
  });
});

describe('createChallengeState', () => {
  it('should create empty state', () => {
    const state = createChallengeState();
    assert.deepStrictEqual(state.activeChallenges, []);
    assert.deepStrictEqual(state.completedChallenges, []);
    assert.strictEqual(state.tokens, 0);
    assert.strictEqual(state.streak, 0);
  });

  it('should initialize stats to zero', () => {
    const state = createChallengeState();
    assert.strictEqual(state.stats.dailyCompleted, 0);
    assert.strictEqual(state.stats.weeklyCompleted, 0);
    assert.strictEqual(state.stats.perfectDays, 0);
    assert.strictEqual(state.stats.longestStreak, 0);
    assert.strictEqual(state.stats.totalTokensEarned, 0);
  });
});

describe('generateChallenge', () => {
  it('should generate challenge successfully', () => {
    const result = generateChallenge('defeat_enemies', 'EASY', 'DAILY');
    assert.ok(result.success);
    assert.ok(result.challenge);
    assert.ok(result.challenge.id);
    assert.ok(result.challenge.name);
    assert.ok(result.challenge.targetCount > 0);
  });

  it('should fail with invalid template', () => {
    const result = generateChallenge('nonexistent', 'EASY', 'DAILY');
    assert.strictEqual(result.success, false);
    assert.ok(result.error);
  });

  it('should fail with invalid difficulty', () => {
    const result = generateChallenge('defeat_enemies', 'INVALID', 'DAILY');
    assert.strictEqual(result.success, false);
  });

  it('should fail with invalid duration', () => {
    const result = generateChallenge('defeat_enemies', 'EASY', 'INVALID');
    assert.strictEqual(result.success, false);
  });

  it('should scale target count with difficulty', () => {
    const easy = generateChallenge('defeat_enemies', 'EASY', 'DAILY');
    const hard = generateChallenge('defeat_enemies', 'HARD', 'DAILY');
    assert.ok(hard.challenge.targetCount > easy.challenge.targetCount);
  });

  it('should scale rewards with difficulty', () => {
    const easy = generateChallenge('defeat_enemies', 'EASY', 'DAILY');
    const hard = generateChallenge('defeat_enemies', 'HARD', 'DAILY');
    assert.ok(hard.challenge.rewards.tokens > easy.challenge.rewards.tokens);
  });

  it('should set expiration time based on duration', () => {
    const now = Date.now();
    const result = generateChallenge('defeat_enemies', 'EASY', 'DAILY', now);
    const expectedExpiry = now + (24 * 60 * 60 * 1000);
    assert.strictEqual(result.challenge.expiresAt, expectedExpiry);
  });

  it('should set status to active', () => {
    const result = generateChallenge('defeat_enemies', 'EASY', 'DAILY');
    assert.strictEqual(result.challenge.status, 'active');
    assert.strictEqual(result.challenge.currentCount, 0);
  });
});

describe('generateDailyChallenges', () => {
  it('should generate 3 daily challenges', () => {
    const state = createChallengeState();
    const newState = generateDailyChallenges(state);
    assert.strictEqual(newState.activeChallenges.length, 3);
  });

  it('should generate challenges of different difficulties', () => {
    const state = createChallengeState();
    const newState = generateDailyChallenges(state);
    const difficulties = newState.activeChallenges.map(c => c.difficulty);
    assert.ok(difficulties.includes('EASY'));
    assert.ok(difficulties.includes('MEDIUM'));
    assert.ok(difficulties.includes('HARD'));
  });

  it('should add to existing challenges', () => {
    let state = createChallengeState();
    state = generateDailyChallenges(state);
    const result = generateWeeklyChallenge(state);
    assert.ok(result.state.activeChallenges.length > 3);
  });
});

describe('generateWeeklyChallenge', () => {
  it('should generate extreme difficulty challenge', () => {
    const state = createChallengeState();
    const result = generateWeeklyChallenge(state);
    assert.ok(result.success);
    assert.strictEqual(result.challenge.difficulty, 'EXTREME');
  });

  it('should set weekly duration', () => {
    const state = createChallengeState();
    const result = generateWeeklyChallenge(state);
    assert.strictEqual(result.challenge.duration, 'WEEKLY');
  });
});

describe('updateChallengeProgress', () => {
  it('should update progress', () => {
    let state = createChallengeState();
    const { challenge } = generateChallenge('defeat_enemies', 'EASY', 'DAILY');
    state.activeChallenges = [challenge];

    const result = updateChallengeProgress(state, 'enemiesDefeated', 5);
    assert.ok(result.success);
    assert.strictEqual(result.state.activeChallenges[0].currentCount, 5);
  });

  it('should fail if no matching challenge', () => {
    const state = createChallengeState();
    const result = updateChallengeProgress(state, 'nonexistent', 5);
    assert.strictEqual(result.success, false);
  });

  it('should mark as completed when target reached', () => {
    let state = createChallengeState();
    const { challenge } = generateChallenge('defeat_enemies', 'EASY', 'DAILY');
    challenge.targetCount = 10;
    state.activeChallenges = [challenge];

    const result = updateChallengeProgress(state, 'enemiesDefeated', 10);
    assert.strictEqual(result.state.activeChallenges[0].status, 'completed');
  });

  it('should accumulate progress', () => {
    let state = createChallengeState();
    const { challenge } = generateChallenge('defeat_enemies', 'EASY', 'DAILY');
    state.activeChallenges = [challenge];

    let result = updateChallengeProgress(state, 'enemiesDefeated', 3);
    result = updateChallengeProgress(result.state, 'enemiesDefeated', 2);
    assert.strictEqual(result.state.activeChallenges[0].currentCount, 5);
  });
});

describe('claimChallengeReward', () => {
  it('should claim reward for completed challenge', () => {
    let state = createChallengeState();
    const { challenge } = generateChallenge('defeat_enemies', 'EASY', 'DAILY');
    challenge.status = 'completed';
    challenge.rewards = { tokens: 10, gold: 50, experience: 100 };
    state.activeChallenges = [challenge];

    const result = claimChallengeReward(state, challenge.id);
    assert.ok(result.success);
    assert.ok(result.state.tokens > 0);
    assert.strictEqual(result.state.activeChallenges.length, 0);
    assert.strictEqual(result.state.completedChallenges.length, 1);
  });

  it('should fail for non-completed challenge', () => {
    let state = createChallengeState();
    const { challenge } = generateChallenge('defeat_enemies', 'EASY', 'DAILY');
    state.activeChallenges = [challenge];

    const result = claimChallengeReward(state, challenge.id);
    assert.strictEqual(result.success, false);
  });

  it('should fail for non-existent challenge', () => {
    const state = createChallengeState();
    const result = claimChallengeReward(state, 'nonexistent');
    assert.strictEqual(result.success, false);
  });

  it('should update streak on first completion', () => {
    let state = createChallengeState();
    const { challenge } = generateChallenge('defeat_enemies', 'EASY', 'DAILY');
    challenge.status = 'completed';
    challenge.rewards = { tokens: 10, gold: 50, experience: 100 };
    state.activeChallenges = [challenge];

    const result = claimChallengeReward(state, challenge.id);
    assert.strictEqual(result.state.streak, 1);
  });

  it('should calculate streak bonus', () => {
    let state = createChallengeState();
    state.streak = 5;
    state.lastCompletionDate = Date.now() - 86400000; // yesterday
    const { challenge } = generateChallenge('defeat_enemies', 'EASY', 'DAILY');
    challenge.status = 'completed';
    challenge.rewards = { tokens: 10, gold: 50, experience: 100 };
    state.activeChallenges = [challenge];

    const result = claimChallengeReward(state, challenge.id);
    assert.ok(result.rewards.bonusTokens > 0);
    assert.strictEqual(result.state.streak, 6);
  });

  it('should update stats on claim', () => {
    let state = createChallengeState();
    const { challenge } = generateChallenge('defeat_enemies', 'EASY', 'DAILY');
    challenge.status = 'completed';
    challenge.duration = 'DAILY';
    challenge.rewards = { tokens: 10, gold: 50, experience: 100 };
    state.activeChallenges = [challenge];

    const result = claimChallengeReward(state, challenge.id);
    assert.strictEqual(result.state.stats.dailyCompleted, 1);
    assert.strictEqual(result.state.totalChallengesCompleted, 1);
  });
});

describe('processExpiredChallenges', () => {
  it('should mark expired challenges', () => {
    let state = createChallengeState();
    const { challenge } = generateChallenge('defeat_enemies', 'EASY', 'DAILY');
    challenge.expiresAt = Date.now() - 1000; // already expired
    state.activeChallenges = [challenge];

    const result = processExpiredChallenges(state);
    assert.ok(result.success);
    assert.strictEqual(result.expiredCount, 1);
    assert.strictEqual(result.state.activeChallenges.length, 0);
  });

  it('should not affect active challenges', () => {
    let state = createChallengeState();
    const { challenge } = generateChallenge('defeat_enemies', 'EASY', 'DAILY');
    challenge.expiresAt = Date.now() + 10000000; // future
    state.activeChallenges = [challenge];

    const result = processExpiredChallenges(state);
    assert.strictEqual(result.expiredCount, 0);
    assert.strictEqual(result.state.activeChallenges.length, 1);
  });

  it('should reset streak on daily expiration', () => {
    let state = createChallengeState();
    state.streak = 5;
    const { challenge } = generateChallenge('defeat_enemies', 'EASY', 'DAILY');
    challenge.expiresAt = Date.now() - 1000;
    state.activeChallenges = [challenge];

    const result = processExpiredChallenges(state);
    assert.strictEqual(result.state.streak, 0);
  });
});

describe('purchaseTokenItem', () => {
  it('should purchase item successfully', () => {
    let state = createChallengeState();
    state.tokens = 100;

    const result = purchaseTokenItem(state, 'rare_chest');
    assert.ok(result.success);
    assert.ok(result.state.tokens < 100);
    assert.strictEqual(result.state.purchasedItems.length, 1);
  });

  it('should fail with insufficient tokens', () => {
    let state = createChallengeState();
    state.tokens = 10;

    const result = purchaseTokenItem(state, 'rare_chest');
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('Insufficient'));
  });

  it('should fail with invalid item', () => {
    let state = createChallengeState();
    state.tokens = 100;

    const result = purchaseTokenItem(state, 'nonexistent');
    assert.strictEqual(result.success, false);
  });

  it('should deduct correct token amount', () => {
    let state = createChallengeState();
    state.tokens = 100;
    const itemCost = TOKEN_SHOP_ITEMS.rare_chest.cost;

    const result = purchaseTokenItem(state, 'rare_chest');
    assert.strictEqual(result.state.tokens, 100 - itemCost);
  });
});

describe('getChallengeProgress', () => {
  it('should calculate percentage correctly', () => {
    const challenge = { currentCount: 5, targetCount: 10, isTimeBased: false };
    assert.strictEqual(getChallengeProgress(challenge), 50);
  });

  it('should cap at 100%', () => {
    const challenge = { currentCount: 15, targetCount: 10, isTimeBased: false };
    assert.strictEqual(getChallengeProgress(challenge), 100);
  });

  it('should handle time-based challenges', () => {
    // For time-based challenges, progress is capped at 100%
    const challenge = { currentCount: 5, targetCount: 10, isTimeBased: true };
    assert.strictEqual(getChallengeProgress(challenge), 100); // Capped at 100
  });
});

describe('getActiveChallengesByType', () => {
  it('should filter by type', () => {
    let state = createChallengeState();
    const { challenge: c1 } = generateChallenge('defeat_enemies', 'EASY', 'DAILY');
    const { challenge: c2 } = generateChallenge('explore_rooms', 'EASY', 'DAILY');
    state.activeChallenges = [c1, c2];

    const combat = getActiveChallengesByType(state, CHALLENGE_TYPES.COMBAT);
    assert.strictEqual(combat.length, 1);
    assert.strictEqual(combat[0].type, CHALLENGE_TYPES.COMBAT);
  });
});

describe('getTimeRemaining', () => {
  it('should calculate time remaining', () => {
    const challenge = { expiresAt: Date.now() + (3 * 60 * 60 * 1000) }; // 3 hours
    const result = getTimeRemaining(challenge);
    assert.strictEqual(result.expired, false);
    assert.strictEqual(result.hours, 3);
  });

  it('should mark expired challenges', () => {
    const challenge = { expiresAt: Date.now() - 1000 };
    const result = getTimeRemaining(challenge);
    assert.strictEqual(result.expired, true);
    assert.strictEqual(result.formatted, 'Expired');
  });

  it('should format days correctly', () => {
    const challenge = { expiresAt: Date.now() + (48 * 60 * 60 * 1000) }; // 48 hours
    const result = getTimeRemaining(challenge);
    assert.ok(result.formatted.includes('d'));
  });
});

describe('hasClaimableRewards', () => {
  it('should return true when rewards available', () => {
    let state = createChallengeState();
    const { challenge } = generateChallenge('defeat_enemies', 'EASY', 'DAILY');
    challenge.status = 'completed';
    state.activeChallenges = [challenge];

    assert.strictEqual(hasClaimableRewards(state), true);
  });

  it('should return false when no rewards', () => {
    let state = createChallengeState();
    const { challenge } = generateChallenge('defeat_enemies', 'EASY', 'DAILY');
    state.activeChallenges = [challenge];

    assert.strictEqual(hasClaimableRewards(state), false);
  });
});

describe('getClaimableChallenges', () => {
  it('should return completed challenges', () => {
    let state = createChallengeState();
    const { challenge: c1 } = generateChallenge('defeat_enemies', 'EASY', 'DAILY');
    const { challenge: c2 } = generateChallenge('explore_rooms', 'EASY', 'DAILY');
    c1.status = 'completed';
    state.activeChallenges = [c1, c2];

    const claimable = getClaimableChallenges(state);
    assert.strictEqual(claimable.length, 1);
    assert.strictEqual(claimable[0].status, 'completed');
  });
});

describe('abandonChallenge', () => {
  it('should abandon challenge successfully', () => {
    let state = createChallengeState();
    const { challenge } = generateChallenge('defeat_enemies', 'EASY', 'DAILY');
    state.activeChallenges = [challenge];

    const result = abandonChallenge(state, challenge.id);
    assert.ok(result.success);
    assert.strictEqual(result.state.activeChallenges.length, 0);
    assert.strictEqual(result.state.completedChallenges.length, 1);
    assert.strictEqual(result.state.completedChallenges[0].status, 'abandoned');
  });

  it('should fail for non-existent challenge', () => {
    const state = createChallengeState();
    const result = abandonChallenge(state, 'nonexistent');
    assert.strictEqual(result.success, false);
  });

  it('should fail for completed challenge', () => {
    let state = createChallengeState();
    const { challenge } = generateChallenge('defeat_enemies', 'EASY', 'DAILY');
    challenge.status = 'completed';
    state.activeChallenges = [challenge];

    const result = abandonChallenge(state, challenge.id);
    assert.strictEqual(result.success, false);
  });
});

describe('getExpiringChallenges', () => {
  it('should return challenges expiring soon', () => {
    let state = createChallengeState();
    const { challenge } = generateChallenge('defeat_enemies', 'EASY', 'DAILY');
    challenge.expiresAt = Date.now() + (1 * 60 * 60 * 1000); // 1 hour
    state.activeChallenges = [challenge];

    const expiring = getExpiringChallenges(state, 2);
    assert.strictEqual(expiring.length, 1);
  });

  it('should not return challenges with more time', () => {
    let state = createChallengeState();
    const { challenge } = generateChallenge('defeat_enemies', 'EASY', 'DAILY');
    challenge.expiresAt = Date.now() + (10 * 60 * 60 * 1000); // 10 hours
    state.activeChallenges = [challenge];

    const expiring = getExpiringChallenges(state, 2);
    assert.strictEqual(expiring.length, 0);
  });
});

describe('areDailyChallengesComplete', () => {
  it('should return true when all daily completed', () => {
    let state = createChallengeState();
    state = generateDailyChallenges(state);
    state.activeChallenges = state.activeChallenges.map(c => ({ ...c, status: 'completed' }));

    assert.strictEqual(areDailyChallengesComplete(state), true);
  });

  it('should return false when some daily active', () => {
    let state = createChallengeState();
    state = generateDailyChallenges(state);

    assert.strictEqual(areDailyChallengesComplete(state), false);
  });
});

describe('getStreakBonus', () => {
  it('should return 0 for no streak', () => {
    const state = createChallengeState();
    assert.strictEqual(getStreakBonus(state), 0);
  });

  it('should return 10% per day', () => {
    const state = createChallengeState();
    state.streak = 5;
    assert.strictEqual(getStreakBonus(state), 50);
  });

  it('should cap at 100%', () => {
    const state = createChallengeState();
    state.streak = 20;
    assert.strictEqual(getStreakBonus(state), 100);
  });
});

describe('getChallengeStats', () => {
  it('should return comprehensive stats', () => {
    const state = createChallengeState();
    const stats = getChallengeStats(state);

    assert.ok('active' in stats);
    assert.ok('completed' in stats);
    assert.ok('tokens' in stats);
    assert.ok('streak' in stats);
    assert.ok('totalCompleted' in stats);
  });
});

describe('UI Constants', () => {
  it('should have icons for all types', () => {
    for (const type of Object.values(CHALLENGE_TYPES)) {
      assert.ok(TYPE_ICONS[type], `Missing icon for ${type}`);
    }
  });

  it('should have duration icons', () => {
    assert.ok(DURATION_ICONS.DAILY);
    assert.ok(DURATION_ICONS.WEEKLY);
    assert.ok(DURATION_ICONS.WEEKEND);
    assert.ok(DURATION_ICONS.EVENT);
  });
});

describe('renderChallengesPanel', () => {
  it('should render panel', () => {
    const state = createChallengeState();
    const html = renderChallengesPanel(state);
    assert.ok(html.includes('challenges-panel'));
    assert.ok(html.includes('Daily Challenges'));
  });

  it('should show token count', () => {
    const state = createChallengeState();
    state.tokens = 50;
    const html = renderChallengesPanel(state);
    assert.ok(html.includes('50'));
  });

  it('should show claimable banner when rewards available', () => {
    let state = createChallengeState();
    const { challenge } = generateChallenge('defeat_enemies', 'EASY', 'DAILY');
    challenge.status = 'completed';
    state.activeChallenges = [challenge];

    const html = renderChallengesPanel(state);
    assert.ok(html.includes('claimable-banner'));
  });
});

describe('renderActiveChallenges', () => {
  it('should show no challenges message when empty', () => {
    const state = createChallengeState();
    const html = renderActiveChallenges(state);
    assert.ok(html.includes('No active challenges'));
  });

  it('should render challenge cards', () => {
    let state = createChallengeState();
    state = generateDailyChallenges(state);
    const html = renderActiveChallenges(state);
    assert.ok(html.includes('challenge-card'));
    assert.ok(html.includes('Daily Challenges'));
  });
});

describe('renderChallengeCard', () => {
  it('should render challenge details', () => {
    const { challenge } = generateChallenge('defeat_enemies', 'EASY', 'DAILY');
    const html = renderChallengeCard(challenge);

    assert.ok(html.includes('challenge-card'));
    assert.ok(html.includes(challenge.name));
    assert.ok(html.includes('challenge-progress-bar'));
  });

  it('should show claim button when completed', () => {
    const { challenge } = generateChallenge('defeat_enemies', 'EASY', 'DAILY');
    challenge.status = 'completed';
    const html = renderChallengeCard(challenge);

    assert.ok(html.includes('claim-btn'));
  });

  it('should show abandon button when active', () => {
    const { challenge } = generateChallenge('defeat_enemies', 'EASY', 'DAILY');
    const html = renderChallengeCard(challenge);

    assert.ok(html.includes('abandon-btn'));
  });

  it('should mark expiring soon challenges', () => {
    const { challenge } = generateChallenge('defeat_enemies', 'EASY', 'DAILY');
    challenge.expiresAt = Date.now() + (30 * 60 * 1000); // 30 minutes
    const html = renderChallengeCard(challenge);

    assert.ok(html.includes('expiring-soon'));
  });
});

describe('renderCompletedChallenges', () => {
  it('should show empty message', () => {
    const state = createChallengeState();
    const html = renderCompletedChallenges(state);
    assert.ok(html.includes('No completed challenges'));
  });

  it('should render completed cards', () => {
    let state = createChallengeState();
    const { challenge } = generateChallenge('defeat_enemies', 'EASY', 'DAILY');
    challenge.status = 'completed';
    challenge.completedAt = Date.now();
    state.completedChallenges = [challenge];

    const html = renderCompletedChallenges(state);
    assert.ok(html.includes('completed-card'));
  });
});

describe('renderCompletedCard', () => {
  it('should show success status for completed', () => {
    const challenge = {
      name: 'Test',
      type: CHALLENGE_TYPES.COMBAT,
      status: 'completed',
      completedAt: Date.now(),
      rewards: { tokens: 10 }
    };
    const html = renderCompletedCard(challenge);
    assert.ok(html.includes('success'));
    assert.ok(html.includes('✅'));
  });

  it('should show expired status', () => {
    const challenge = {
      name: 'Test',
      type: CHALLENGE_TYPES.COMBAT,
      status: 'expired',
      expiredAt: Date.now()
    };
    const html = renderCompletedCard(challenge);
    assert.ok(html.includes('expired'));
    assert.ok(html.includes('⏰'));
  });
});

describe('renderTokenShop', () => {
  it('should render shop', () => {
    const state = createChallengeState();
    state.tokens = 50;
    const html = renderTokenShop(state);

    assert.ok(html.includes('Token Shop'));
    assert.ok(html.includes('50'));
    assert.ok(html.includes('shop-items'));
  });

  it('should render all shop items', () => {
    const state = createChallengeState();
    const html = renderTokenShop(state);

    for (const item of Object.values(TOKEN_SHOP_ITEMS)) {
      assert.ok(html.includes(item.name));
    }
  });
});

describe('renderShopItem', () => {
  it('should show buy button when can afford', () => {
    const state = createChallengeState();
    state.tokens = 100;
    const html = renderShopItem('rare_chest', TOKEN_SHOP_ITEMS.rare_chest, state);

    assert.ok(html.includes('Buy'));
    assert.ok(!html.includes('cannot-afford'));
  });

  it('should disable when cannot afford', () => {
    const state = createChallengeState();
    state.tokens = 10;
    const html = renderShopItem('rare_chest', TOKEN_SHOP_ITEMS.rare_chest, state);

    assert.ok(html.includes('cannot-afford'));
    assert.ok(html.includes('disabled'));
  });
});

describe('renderChallengeStatsPanel', () => {
  it('should render stats', () => {
    const state = createChallengeState();
    state.streak = 5;
    state.stats.totalTokensEarned = 100;
    const html = renderChallengeStatsPanel(state);

    assert.ok(html.includes('Challenge Statistics'));
    assert.ok(html.includes('stats-grid'));
    assert.ok(html.includes('Streak Bonus'));
  });
});

describe('renderRewardClaimPopup', () => {
  it('should render reward popup', () => {
    const challenge = {
      name: 'Test Challenge',
      type: CHALLENGE_TYPES.COMBAT,
      rewards: { tokens: 10, gold: 50, experience: 100 }
    };
    const rewards = { tokens: 10, gold: 50, experience: 100, bonusTokens: 2, totalTokens: 12 };

    const html = renderRewardClaimPopup(challenge, rewards, 20);
    assert.ok(html.includes('Challenge Complete'));
    assert.ok(html.includes('Test Challenge'));
    assert.ok(html.includes('Streak Bonus'));
    assert.ok(html.includes('+2'));
  });
});

describe('renderChallengeCompleteNotification', () => {
  it('should render notification', () => {
    const challenge = {
      name: 'Test',
      type: CHALLENGE_TYPES.COMBAT,
      rewards: { tokens: 10 }
    };
    const html = renderChallengeCompleteNotification(challenge);

    assert.ok(html.includes('Challenge Complete'));
    assert.ok(html.includes('10'));
  });
});

describe('renderExpiringWarning', () => {
  it('should return empty for no challenges', () => {
    const html = renderExpiringWarning([]);
    assert.strictEqual(html, '');
  });

  it('should render warning', () => {
    const challenges = [{
      name: 'Test',
      expiresAt: Date.now() + 3600000
    }];
    const html = renderExpiringWarning(challenges);
    assert.ok(html.includes('Expiring Soon'));
  });
});

describe('renderProgressNotification', () => {
  it('should render progress update', () => {
    const challenge = {
      name: 'Test',
      type: CHALLENGE_TYPES.COMBAT,
      currentCount: 5,
      targetCount: 10,
      isTimeBased: false
    };
    const html = renderProgressNotification(challenge, 3, 5);

    assert.ok(html.includes('progress-notification'));
    assert.ok(html.includes('5/10'));
  });
});

describe('renderStreakMilestone', () => {
  it('should return empty for non-milestone', () => {
    const html = renderStreakMilestone(2);
    assert.strictEqual(html, '');
  });

  it('should render 3-day milestone', () => {
    const html = renderStreakMilestone(3);
    assert.ok(html.includes('3 Day Streak'));
  });

  it('should render 7-day milestone', () => {
    const html = renderStreakMilestone(7);
    assert.ok(html.includes('Week Warrior'));
  });
});

describe('renderMiniTracker', () => {
  it('should show empty state', () => {
    const state = createChallengeState();
    const html = renderMiniTracker(state);
    assert.ok(html.includes('No active challenges'));
  });

  it('should show mini challenges', () => {
    let state = createChallengeState();
    state = generateDailyChallenges(state);
    const html = renderMiniTracker(state);

    assert.ok(html.includes('mini-challenge'));
    assert.ok(html.includes('mini-progress'));
  });

  it('should show claim indicator when complete', () => {
    let state = createChallengeState();
    const { challenge } = generateChallenge('defeat_enemies', 'EASY', 'DAILY');
    challenge.status = 'completed';
    state.activeChallenges = [challenge];

    const html = renderMiniTracker(state);
    assert.ok(html.includes('claim-indicator'));
  });
});

describe('renderPurchaseConfirmation', () => {
  it('should render confirmation dialog', () => {
    const html = renderPurchaseConfirmation('rare_chest', TOKEN_SHOP_ITEMS.rare_chest);

    assert.ok(html.includes('Confirm Purchase'));
    assert.ok(html.includes('Rare Chest'));
    assert.ok(html.includes('confirm-btn'));
    assert.ok(html.includes('cancel-btn'));
  });
});

describe('renderAbandonConfirmation', () => {
  it('should render abandon dialog', () => {
    const challenge = { id: 'test', name: 'Test Challenge' };
    const html = renderAbandonConfirmation(challenge);

    assert.ok(html.includes('Abandon Challenge'));
    assert.ok(html.includes('Test Challenge'));
    assert.ok(html.includes('warning'));
    assert.ok(html.includes('confirm-abandon-btn'));
  });
});
