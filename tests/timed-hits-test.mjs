/**
 * Tests for Timed Hits System
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  TIMING_RATING,
  HIT_TYPE,
  DEFAULT_WINDOWS,
  RATING_BONUSES,
  DIFFICULTY_MODIFIERS,
  createTimedHitChallenge,
  startChallenge,
  processInput,
  isTimedOut,
  getTimeoutResult,
  calculateRating,
  getBonus,
  applyAttackTiming,
  applyDefendTiming,
  applyCounterTiming,
  getChallengeProgress,
  getOptimalPosition,
  getTimingFeedback,
  isSuccessfulTiming,
  getRatingColor,
  createHitSequence,
  calculateSequenceBonus,
} from '../src/timed-hits.js';

import {
  renderTimingBar,
  renderTimingResult,
  renderRatingBadge,
  renderSequenceProgress,
  renderSequenceSummary,
  renderQTEPrompt,
  renderCompactIndicator,
  getTimedHitsStyles,
} from '../src/timed-hits-ui.js';

// ====================
// Constants Tests
// ====================

describe('Timed Hits Constants', () => {
  it('should define timing ratings', () => {
    assert.strictEqual(TIMING_RATING.PERFECT, 'perfect');
    assert.strictEqual(TIMING_RATING.GOOD, 'good');
    assert.strictEqual(TIMING_RATING.OK, 'ok');
    assert.strictEqual(TIMING_RATING.MISS, 'miss');
  });

  it('should define hit types', () => {
    assert.strictEqual(HIT_TYPE.ATTACK, 'attack');
    assert.strictEqual(HIT_TYPE.DEFEND, 'defend');
    assert.strictEqual(HIT_TYPE.COUNTER, 'counter');
    assert.strictEqual(HIT_TYPE.CHARGE, 'charge');
  });

  it('should have valid default windows', () => {
    assert.strictEqual(DEFAULT_WINDOWS.perfect, 50);
    assert.strictEqual(DEFAULT_WINDOWS.good, 150);
    assert.strictEqual(DEFAULT_WINDOWS.ok, 300);
  });

  it('should have bonus multipliers for all types', () => {
    assert.ok(RATING_BONUSES.attack);
    assert.ok(RATING_BONUSES.defend);
    assert.ok(RATING_BONUSES.counter);
    assert.ok(RATING_BONUSES.charge);
  });

  it('should have difficulty modifiers', () => {
    assert.strictEqual(DIFFICULTY_MODIFIERS.easy, 1.5);
    assert.strictEqual(DIFFICULTY_MODIFIERS.normal, 1.0);
    assert.strictEqual(DIFFICULTY_MODIFIERS.hard, 0.75);
    assert.strictEqual(DIFFICULTY_MODIFIERS.expert, 0.5);
  });
});

// ====================
// Challenge Creation Tests
// ====================

describe('createTimedHitChallenge', () => {
  it('should create default challenge', () => {
    const challenge = createTimedHitChallenge();
    assert.strictEqual(challenge.type, HIT_TYPE.ATTACK);
    assert.strictEqual(challenge.duration, 1000);
    assert.strictEqual(challenge.optimalTime, 500);
    assert.strictEqual(challenge.difficulty, 'normal');
    assert.strictEqual(challenge.completed, false);
  });

  it('should accept custom options', () => {
    const challenge = createTimedHitChallenge({
      type: HIT_TYPE.DEFEND,
      duration: 800,
      optimalTime: 400,
    });
    assert.strictEqual(challenge.type, HIT_TYPE.DEFEND);
    assert.strictEqual(challenge.duration, 800);
    assert.strictEqual(challenge.optimalTime, 400);
  });

  it('should clamp duration to valid range', () => {
    const tooShort = createTimedHitChallenge({ duration: 100 });
    const tooLong = createTimedHitChallenge({ duration: 10000 });
    assert.strictEqual(tooShort.duration, 500);
    assert.strictEqual(tooLong.duration, 3000);
  });

  it('should apply difficulty modifier to windows', () => {
    const easy = createTimedHitChallenge({ difficulty: 'easy' });
    const hard = createTimedHitChallenge({ difficulty: 'hard' });
    assert.ok(easy.windows.perfect > hard.windows.perfect);
  });

  it('should accept custom windows', () => {
    const challenge = createTimedHitChallenge({
      customWindows: { perfect: 100, good: 200, ok: 400 },
    });
    assert.strictEqual(challenge.windows.perfect, 100);
    assert.strictEqual(challenge.windows.good, 200);
    assert.strictEqual(challenge.windows.ok, 400);
  });
});

describe('startChallenge', () => {
  it('should set start time', () => {
    const challenge = createTimedHitChallenge();
    const started = startChallenge(challenge, 1000);
    assert.strictEqual(started.startTime, 1000);
    assert.strictEqual(started.completed, false);
  });

  it('should reset state on restart', () => {
    const challenge = {
      ...createTimedHitChallenge(),
      inputTime: 500,
      rating: TIMING_RATING.GOOD,
      completed: true,
    };
    const restarted = startChallenge(challenge, 2000);
    assert.strictEqual(restarted.inputTime, null);
    assert.strictEqual(restarted.rating, null);
    assert.strictEqual(restarted.completed, false);
  });

  it('should handle null challenge', () => {
    const result = startChallenge(null, 1000);
    assert.ok(result);
    assert.strictEqual(result.type, HIT_TYPE.ATTACK);
  });
});

// ====================
// Input Processing Tests
// ====================

describe('processInput', () => {
  it('should process perfect timing', () => {
    const challenge = startChallenge(createTimedHitChallenge(), 1000);
    const result = processInput(challenge, 1500); // Exact optimal time
    assert.strictEqual(result.rating, TIMING_RATING.PERFECT);
    assert.strictEqual(result.challenge.completed, true);
  });

  it('should process good timing', () => {
    const challenge = startChallenge(createTimedHitChallenge(), 1000);
    const result = processInput(challenge, 1600); // 100ms off
    assert.strictEqual(result.rating, TIMING_RATING.GOOD);
  });

  it('should process ok timing', () => {
    const challenge = startChallenge(createTimedHitChallenge(), 1000);
    const result = processInput(challenge, 1750); // 250ms off
    assert.strictEqual(result.rating, TIMING_RATING.OK);
  });

  it('should process miss', () => {
    const challenge = startChallenge(createTimedHitChallenge(), 1000);
    const result = processInput(challenge, 1900); // 400ms off
    assert.strictEqual(result.rating, TIMING_RATING.MISS);
  });

  it('should calculate time delta', () => {
    const challenge = startChallenge(createTimedHitChallenge(), 1000);
    const result = processInput(challenge, 1550);
    assert.strictEqual(result.timeDelta, 50); // 50ms late
  });

  it('should return bonus multiplier', () => {
    const challenge = startChallenge(createTimedHitChallenge(), 1000);
    const result = processInput(challenge, 1500);
    assert.strictEqual(result.bonus, 1.5); // Perfect attack bonus
  });

  it('should handle already completed challenge', () => {
    const challenge = {
      ...startChallenge(createTimedHitChallenge(), 1000),
      completed: true,
    };
    const result = processInput(challenge, 1500);
    assert.strictEqual(result.rating, TIMING_RATING.MISS);
  });

  it('should handle null challenge', () => {
    const result = processInput(null, 1500);
    assert.strictEqual(result.rating, TIMING_RATING.MISS);
  });
});

describe('isTimedOut', () => {
  it('should detect timeout', () => {
    const challenge = startChallenge(createTimedHitChallenge(), 1000);
    assert.strictEqual(isTimedOut(challenge, 1500), false);
    assert.strictEqual(isTimedOut(challenge, 2500), true);
  });

  it('should handle null challenge', () => {
    assert.strictEqual(isTimedOut(null, 1000), false);
  });

  it('should handle challenge without start time', () => {
    const challenge = createTimedHitChallenge();
    assert.strictEqual(isTimedOut(challenge, 1000), false);
  });
});

describe('getTimeoutResult', () => {
  it('should return miss result', () => {
    const challenge = startChallenge(createTimedHitChallenge(), 1000);
    const result = getTimeoutResult(challenge);
    assert.strictEqual(result.rating, TIMING_RATING.MISS);
    assert.strictEqual(result.challenge.completed, true);
  });
});

// ====================
// Rating Calculation Tests
// ====================

describe('calculateRating', () => {
  it('should return perfect for small delta', () => {
    assert.strictEqual(calculateRating(30, DEFAULT_WINDOWS), TIMING_RATING.PERFECT);
  });

  it('should return good for moderate delta', () => {
    assert.strictEqual(calculateRating(100, DEFAULT_WINDOWS), TIMING_RATING.GOOD);
  });

  it('should return ok for larger delta', () => {
    assert.strictEqual(calculateRating(200, DEFAULT_WINDOWS), TIMING_RATING.OK);
  });

  it('should return miss for very large delta', () => {
    assert.strictEqual(calculateRating(500, DEFAULT_WINDOWS), TIMING_RATING.MISS);
  });

  it('should handle boundary values', () => {
    assert.strictEqual(calculateRating(50, DEFAULT_WINDOWS), TIMING_RATING.PERFECT);
    assert.strictEqual(calculateRating(51, DEFAULT_WINDOWS), TIMING_RATING.GOOD);
    assert.strictEqual(calculateRating(150, DEFAULT_WINDOWS), TIMING_RATING.GOOD);
    assert.strictEqual(calculateRating(151, DEFAULT_WINDOWS), TIMING_RATING.OK);
  });
});

describe('getBonus', () => {
  it('should return correct attack bonuses', () => {
    assert.strictEqual(getBonus(HIT_TYPE.ATTACK, TIMING_RATING.PERFECT), 1.5);
    assert.strictEqual(getBonus(HIT_TYPE.ATTACK, TIMING_RATING.GOOD), 1.25);
    assert.strictEqual(getBonus(HIT_TYPE.ATTACK, TIMING_RATING.OK), 1.1);
    assert.strictEqual(getBonus(HIT_TYPE.ATTACK, TIMING_RATING.MISS), 1.0);
  });

  it('should return correct defend bonuses', () => {
    assert.strictEqual(getBonus(HIT_TYPE.DEFEND, TIMING_RATING.PERFECT), 0.25);
    assert.strictEqual(getBonus(HIT_TYPE.DEFEND, TIMING_RATING.MISS), 1.0);
  });

  it('should return correct counter bonuses', () => {
    assert.strictEqual(getBonus(HIT_TYPE.COUNTER, TIMING_RATING.PERFECT), 0.5);
    assert.strictEqual(getBonus(HIT_TYPE.COUNTER, TIMING_RATING.MISS), 0);
  });

  it('should handle unknown type', () => {
    const bonus = getBonus('unknown', TIMING_RATING.PERFECT);
    assert.strictEqual(bonus, 1.5); // Falls back to attack
  });
});

// ====================
// Timing Application Tests
// ====================

describe('applyAttackTiming', () => {
  it('should apply perfect timing bonus', () => {
    const result = applyAttackTiming(100, TIMING_RATING.PERFECT);
    assert.strictEqual(result.damage, 150);
    assert.strictEqual(result.bonusDamage, 50);
    assert.strictEqual(result.isCritical, true);
  });

  it('should apply good timing bonus', () => {
    const result = applyAttackTiming(100, TIMING_RATING.GOOD);
    assert.strictEqual(result.damage, 125);
    assert.strictEqual(result.bonusDamage, 25);
    assert.strictEqual(result.isCritical, false);
  });

  it('should apply no bonus for miss', () => {
    const result = applyAttackTiming(100, TIMING_RATING.MISS);
    assert.strictEqual(result.damage, 100);
    assert.strictEqual(result.bonusDamage, 0);
  });
});

describe('applyDefendTiming', () => {
  it('should reduce damage for perfect guard', () => {
    const result = applyDefendTiming(100, TIMING_RATING.PERFECT);
    assert.strictEqual(result.damage, 25);
    assert.strictEqual(result.damageBlocked, 75);
    assert.strictEqual(result.isPerfectBlock, true);
  });

  it('should reduce damage for good guard', () => {
    const result = applyDefendTiming(100, TIMING_RATING.GOOD);
    assert.strictEqual(result.damage, 50);
    assert.strictEqual(result.damageBlocked, 50);
  });

  it('should not reduce damage for miss', () => {
    const result = applyDefendTiming(100, TIMING_RATING.MISS);
    assert.strictEqual(result.damage, 100);
    assert.strictEqual(result.damageBlocked, 0);
  });
});

describe('applyCounterTiming', () => {
  it('should reflect damage for perfect counter', () => {
    const result = applyCounterTiming(100, TIMING_RATING.PERFECT);
    assert.strictEqual(result.reflectedDamage, 50);
    assert.strictEqual(result.isSuccessful, true);
  });

  it('should not reflect damage for miss', () => {
    const result = applyCounterTiming(100, TIMING_RATING.MISS);
    assert.strictEqual(result.reflectedDamage, 0);
    assert.strictEqual(result.isSuccessful, false);
  });
});

// ====================
// Progress and UI Tests
// ====================

describe('getChallengeProgress', () => {
  it('should return correct progress percentage', () => {
    const challenge = startChallenge(createTimedHitChallenge(), 1000);
    assert.strictEqual(getChallengeProgress(challenge, 1000), 0);
    assert.strictEqual(getChallengeProgress(challenge, 1500), 50);
    assert.strictEqual(getChallengeProgress(challenge, 2000), 100);
  });

  it('should clamp to 0-100', () => {
    const challenge = startChallenge(createTimedHitChallenge(), 1000);
    assert.strictEqual(getChallengeProgress(challenge, 500), 0);
    assert.strictEqual(getChallengeProgress(challenge, 3000), 100);
  });

  it('should handle null challenge', () => {
    assert.strictEqual(getChallengeProgress(null, 1000), 0);
  });
});

describe('getOptimalPosition', () => {
  it('should return optimal position as percentage', () => {
    const challenge = createTimedHitChallenge();
    assert.strictEqual(getOptimalPosition(challenge), 50);
  });

  it('should handle custom optimal time', () => {
    const challenge = createTimedHitChallenge({ optimalTime: 250, duration: 1000 });
    assert.strictEqual(getOptimalPosition(challenge), 25);
  });

  it('should handle null challenge', () => {
    assert.strictEqual(getOptimalPosition(null), 50);
  });
});

describe('getTimingFeedback', () => {
  it('should return attack feedback', () => {
    const perfect = getTimingFeedback(TIMING_RATING.PERFECT, HIT_TYPE.ATTACK);
    assert.ok(perfect.includes('Perfect'));
    assert.ok(perfect.includes('Critical'));
  });

  it('should return defend feedback', () => {
    const perfect = getTimingFeedback(TIMING_RATING.PERFECT, HIT_TYPE.DEFEND);
    assert.ok(perfect.includes('Perfect'));
    assert.ok(perfect.includes('guard'));
  });

  it('should return counter feedback', () => {
    const perfect = getTimingFeedback(TIMING_RATING.PERFECT, HIT_TYPE.COUNTER);
    assert.ok(perfect.includes('counter'));
  });

  it('should return miss feedback', () => {
    const miss = getTimingFeedback(TIMING_RATING.MISS, HIT_TYPE.ATTACK);
    assert.ok(miss.includes('Missed'));
  });
});

describe('isSuccessfulTiming', () => {
  it('should identify successful ratings', () => {
    assert.strictEqual(isSuccessfulTiming(TIMING_RATING.PERFECT), true);
    assert.strictEqual(isSuccessfulTiming(TIMING_RATING.GOOD), true);
    assert.strictEqual(isSuccessfulTiming(TIMING_RATING.OK), true);
    assert.strictEqual(isSuccessfulTiming(TIMING_RATING.MISS), false);
  });
});

describe('getRatingColor', () => {
  it('should return gold for perfect', () => {
    assert.strictEqual(getRatingColor(TIMING_RATING.PERFECT), '#ffd700');
  });

  it('should return green for good', () => {
    assert.strictEqual(getRatingColor(TIMING_RATING.GOOD), '#00ff00');
  });

  it('should return yellow for ok', () => {
    assert.strictEqual(getRatingColor(TIMING_RATING.OK), '#ffff00');
  });

  it('should return red for miss', () => {
    assert.strictEqual(getRatingColor(TIMING_RATING.MISS), '#ff4444');
  });
});

// ====================
// Sequence Tests
// ====================

describe('createHitSequence', () => {
  it('should create sequence of challenges', () => {
    const sequence = createHitSequence(3);
    assert.strictEqual(sequence.length, 3);
    sequence.forEach(challenge => {
      assert.strictEqual(challenge.type, HIT_TYPE.ATTACK);
      assert.strictEqual(challenge.completed, false);
    });
  });

  it('should make later hits faster', () => {
    const sequence = createHitSequence(5, { duration: 1000 });
    assert.ok(sequence[0].duration > sequence[4].duration);
  });

  it('should clamp count to valid range', () => {
    const tooFew = createHitSequence(0);
    const tooMany = createHitSequence(100);
    assert.strictEqual(tooFew.length, 1);
    assert.strictEqual(tooMany.length, 10);
  });
});

describe('calculateSequenceBonus', () => {
  it('should calculate total bonus', () => {
    const results = [
      { rating: TIMING_RATING.PERFECT, bonus: 1.5 },
      { rating: TIMING_RATING.GOOD, bonus: 1.25 },
      { rating: TIMING_RATING.OK, bonus: 1.1 },
    ];
    const summary = calculateSequenceBonus(results);
    assert.strictEqual(summary.hitCount, 3);
    assert.strictEqual(summary.perfectCount, 1);
    assert.strictEqual(summary.allPerfect, false);
  });

  it('should give bonus for all perfect', () => {
    const results = [
      { rating: TIMING_RATING.PERFECT, bonus: 1.5 },
      { rating: TIMING_RATING.PERFECT, bonus: 1.5 },
    ];
    const summary = calculateSequenceBonus(results);
    assert.strictEqual(summary.allPerfect, true);
    assert.ok(summary.totalBonus > 1.5); // Includes all-perfect bonus
  });

  it('should handle empty results', () => {
    const summary = calculateSequenceBonus([]);
    assert.strictEqual(summary.totalBonus, 1);
  });

  it('should handle null results', () => {
    const summary = calculateSequenceBonus(null);
    assert.strictEqual(summary.totalBonus, 1);
  });
});

// ====================
// UI Rendering Tests
// ====================

describe('renderTimingBar', () => {
  it('should render timing bar', () => {
    const challenge = startChallenge(createTimedHitChallenge(), 1000);
    const html = renderTimingBar(challenge, 1250);
    assert.ok(html.includes('timed-hit-bar'));
    assert.ok(html.includes('timing-track'));
    assert.ok(html.includes('timing-cursor'));
  });

  it('should include timing zones', () => {
    const challenge = startChallenge(createTimedHitChallenge(), 1000);
    const html = renderTimingBar(challenge, 1000);
    assert.ok(html.includes('zone-perfect'));
    assert.ok(html.includes('zone-good'));
    assert.ok(html.includes('zone-ok'));
  });

  it('should return empty for null challenge', () => {
    assert.strictEqual(renderTimingBar(null, 1000), '');
  });
});

describe('renderTimingResult', () => {
  it('should render perfect result', () => {
    const html = renderTimingResult(TIMING_RATING.PERFECT, HIT_TYPE.ATTACK, 1.5);
    assert.ok(html.includes('perfect'));
    assert.ok(html.includes('x1.50'));
  });

  it('should render miss result', () => {
    const html = renderTimingResult(TIMING_RATING.MISS, HIT_TYPE.ATTACK);
    assert.ok(html.includes('miss'));
    assert.ok(html.includes('Missed'));
  });

  it('should render defend result', () => {
    const html = renderTimingResult(TIMING_RATING.PERFECT, HIT_TYPE.DEFEND, 0.25);
    assert.ok(html.includes('75% blocked'));
  });
});

describe('renderRatingBadge', () => {
  it('should render badge with rating', () => {
    const html = renderRatingBadge(TIMING_RATING.PERFECT);
    assert.ok(html.includes('timing-badge'));
    assert.ok(html.includes('perfect'));
    assert.ok(html.includes('Perfect'));
  });
});

describe('renderSequenceProgress', () => {
  it('should render sequence dots', () => {
    const results = [{ rating: TIMING_RATING.PERFECT }];
    const html = renderSequenceProgress(1, 3, results);
    assert.ok(html.includes('timed-hit-sequence'));
    assert.ok(html.includes('Hit 2/3'));
    assert.ok(html.includes('sequence-dot'));
  });
});

describe('renderSequenceSummary', () => {
  it('should render summary', () => {
    const summary = { totalBonus: 1.35, perfectCount: 2, hitCount: 3, allPerfect: false };
    const html = renderSequenceSummary(summary);
    assert.ok(html.includes('sequence-summary'));
    assert.ok(html.includes('Hits: 3'));
    assert.ok(html.includes('Perfect: 2'));
  });

  it('should highlight all perfect', () => {
    const summary = { totalBonus: 1.875, perfectCount: 3, hitCount: 3, allPerfect: true };
    const html = renderSequenceSummary(summary);
    assert.ok(html.includes('all-perfect'));
  });

  it('should return empty for null summary', () => {
    assert.strictEqual(renderSequenceSummary(null), '');
  });
});

describe('renderQTEPrompt', () => {
  it('should render QTE prompt', () => {
    const html = renderQTEPrompt(HIT_TYPE.ATTACK, 'SPACE');
    assert.ok(html.includes('qte-prompt'));
    assert.ok(html.includes('SPACE'));
    assert.ok(html.includes('Attack'));
  });
});

describe('renderCompactIndicator', () => {
  it('should render compact indicator', () => {
    const challenge = startChallenge(createTimedHitChallenge(), 1000);
    const html = renderCompactIndicator(challenge, 1250);
    assert.ok(html.includes('timing-compact'));
    assert.ok(html.includes('compact-track'));
  });

  it('should highlight near optimal', () => {
    const challenge = startChallenge(createTimedHitChallenge(), 1000);
    const html = renderCompactIndicator(challenge, 1495); // Very close to 50%
    assert.ok(html.includes('near-optimal'));
  });

  it('should return empty for null challenge', () => {
    assert.strictEqual(renderCompactIndicator(null, 1000), '');
  });
});

describe('getTimedHitsStyles', () => {
  it('should return CSS string', () => {
    const css = getTimedHitsStyles();
    assert.ok(typeof css === 'string');
    assert.ok(css.length > 0);
  });

  it('should include key classes', () => {
    const css = getTimedHitsStyles();
    assert.ok(css.includes('.timed-hit-bar'));
    assert.ok(css.includes('.timing-track'));
    assert.ok(css.includes('.timed-hit-result'));
  });

  it('should include animations', () => {
    const css = getTimedHitsStyles();
    assert.ok(css.includes('@keyframes'));
    assert.ok(css.includes('pulse-prompt'));
  });
});

// ====================
// Security Tests
// ====================

describe('Security - No banned words', () => {
  const bannedWords = ['egg', 'easter', 'yolk', 'bunny', 'rabbit', 'phoenix'];

  it('should not contain banned words in core module', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync(new URL('../src/timed-hits.js', import.meta.url), 'utf-8').toLowerCase();
    bannedWords.forEach(word => {
      assert.ok(!content.includes(word), `Found banned word: ${word}`);
    });
  });

  it('should not contain banned words in UI module', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync(new URL('../src/timed-hits-ui.js', import.meta.url), 'utf-8').toLowerCase();
    bannedWords.forEach(word => {
      assert.ok(!content.includes(word), `Found banned word: ${word}`);
    });
  });
});

// ====================
// Edge Cases
// ====================

describe('Edge Cases', () => {
  it('should handle very fast inputs', () => {
    const challenge = startChallenge(createTimedHitChallenge(), 1000);
    const result = processInput(challenge, 1001); // 1ms after start
    assert.ok(result.rating); // Should not crash
  });

  it('should handle exact boundary timing', () => {
    const challenge = startChallenge(createTimedHitChallenge({
      optimalTime: 500,
      customWindows: { perfect: 50, good: 100, ok: 200 },
    }), 1000);
    // Test exact boundary at 50ms - still perfect (50 <= 50)
    const atBoundary = processInput(challenge, 1550);
    assert.strictEqual(atBoundary.rating, TIMING_RATING.PERFECT);
    // Test just past boundary at 51ms - should be good
    const pastBoundary = processInput(startChallenge(createTimedHitChallenge({
      optimalTime: 500,
      customWindows: { perfect: 50, good: 100, ok: 200 },
    }), 1000), 1551);
    assert.strictEqual(pastBoundary.rating, TIMING_RATING.GOOD);
  });

  it('should handle zero base damage', () => {
    const result = applyAttackTiming(0, TIMING_RATING.PERFECT);
    assert.strictEqual(result.damage, 0);
    assert.strictEqual(result.bonusDamage, 0);
  });

  it('should handle very large damage values', () => {
    const result = applyAttackTiming(1000000, TIMING_RATING.PERFECT);
    assert.strictEqual(result.damage, 1500000);
  });
});
