import { strict as assert } from 'node:assert';
import { renderAchievementsPanel, attachAchievementsHandlers } from '../src/achievements-ui.js';

// Ensure the achievements UI module exports the expected functions.
assert.equal(typeof renderAchievementsPanel, 'function', 'renderAchievementsPanel should be a function');
assert.equal(typeof attachAchievementsHandlers, 'function', 'attachAchievementsHandlers should be a function');

console.log('achievements-ui module import test passed');
