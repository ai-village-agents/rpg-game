/**
 * Achievement Notification Toast Tests — AI Village RPG
 * Run: node tests/achievement-notifications-test.mjs
 */

import {
  trackAchievements,
  consumeAchievementNotifications,
  getAllAchievements
} from '../src/achievements.js';

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) {
    passed++;
    console.log('  PASS: ' + msg);
  } else {
    failed++;
    console.error('  FAIL: ' + msg);
  }
}

function notificationHasId(notifications, id) {
  return notifications.some((notif) => notif && notif.id === id);
}

const allAchievements = getAllAchievements();
const achievementIds = new Set(allAchievements.map((achievement) => achievement.id));

assert(achievementIds.has('first_blood'), 'first_blood achievement exists');

console.log('\n--- Achievement Notifications ---');

// 1. trackAchievements adds no notifications when no new achievements unlocked
{
  const state = {
    unlockedAchievements: ['first_blood'],
    achievementNotifications: [],
    gameStats: { enemiesDefeated: 1 }
  };
  const result = trackAchievements(state);
  const notifs = result.achievementNotifications || [];
  assert(!notificationHasId(notifs, 'first_blood'), 'No duplicate notification for first_blood');
}

// 2. trackAchievements adds notification when new achievement unlocked
{
  const state = {
    unlockedAchievements: [],
    achievementNotifications: [],
    gameStats: { enemiesDefeated: 1 }
  };
  const result = trackAchievements(state);
  const notifs = result.achievementNotifications || [];
  assert(notifs.length >= 1, 'New achievement creates at least one notification');
  assert(notificationHasId(notifs, 'first_blood'), 'Notification includes first_blood');
}

// 3. notification has id, name, timestamp fields
{
  const state = {
    unlockedAchievements: [],
    achievementNotifications: [],
    gameStats: { enemiesDefeated: 1 }
  };
  const result = trackAchievements(state);
  const notif = (result.achievementNotifications || [])[0];
  assert(typeof notif?.id === 'string', 'Notification id is a string');
  assert(typeof notif?.name === 'string', 'Notification name is a string');
  assert(typeof notif?.timestamp === 'number', 'Notification timestamp is a number');
}

// 4. consumeAchievementNotifications clears notifications
{
  const state = {
    achievementNotifications: [{ id: 'x', name: 'X', timestamp: 1 }]
  };
  const result = consumeAchievementNotifications(state);
  assert(Array.isArray(result.achievementNotifications), 'Notifications is an array after consume');
  assert(result.achievementNotifications.length === 0, 'Notifications cleared after consume');
}

// 5. trackAchievements does not duplicate notifications already unlocked
{
  const state = {
    unlockedAchievements: ['first_blood'],
    achievementNotifications: [],
    gameStats: { enemiesDefeated: 5 }
  };
  const result = trackAchievements(state);
  const notifs = result.achievementNotifications || [];
  assert(notifs.length === 0, 'No notifications when first_blood already unlocked');
}

// 6. multiple achievements unlocked simultaneously creates multiple notifications
{
  const state = {
    unlockedAchievements: [],
    achievementNotifications: [],
    gameStats: { enemiesDefeated: 100, bossesDefeated: 5 }
  };
  const result = trackAchievements(state);
  const notifs = result.achievementNotifications || [];
  assert(notifs.length > 1, 'Multiple notifications created for multiple unlocks');
}

console.log('Achievement notifications tests: passed=' + passed + ', failed=' + failed);
process.exit(failed > 0 ? 1 : 0);
