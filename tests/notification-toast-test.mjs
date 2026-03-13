import assert from 'node:assert';
import { NOTIFICATION_TYPES, createNotification, addNotification, expireNotifications, renderNotificationToasts, getNotificationToastStyles } from '../src/notification-toast.js';

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

function countOccurrences(haystack, needle) {
  if (!needle) return 0;
  return haystack.split(needle).length - 1;
}

test('NOTIFICATION_TYPES has all expected types', () => {
  const expectedTypes = [
    'SYSTEM_MESSAGE', 'QUEST_UPDATE', 'ITEM_PICKUP', 'REPUTATION_CHANGE',
    'WEATHER_CHANGE', 'COMPANION_EVENT', 'LEVEL_UP', 'DANGER_WARNING',
  ];
  for (const type of expectedTypes) {
    assert.ok(Object.prototype.hasOwnProperty.call(NOTIFICATION_TYPES, type), `Missing type ${type}`);
  }
});

test('createNotification creates valid notification', () => {
  const notification = createNotification(NOTIFICATION_TYPES.ITEM_PICKUP, 'Picked up a sword', {
    duration: 2500,
    priority: 'high',
    timestamp: 12345,
  });
  assert.strictEqual(notification.type, NOTIFICATION_TYPES.ITEM_PICKUP);
  assert.strictEqual(notification.message, 'Picked up a sword');
  assert.strictEqual(notification.duration, 2500);
  assert.strictEqual(notification.priority, 'high');
  assert.strictEqual(notification.timestamp, 12345);
  assert.ok(notification.id);
});

test('createNotification uses defaults for missing options', () => {
  const notification = createNotification(NOTIFICATION_TYPES.SYSTEM_MESSAGE, 'Hello');
  assert.strictEqual(notification.duration, 4000);
  assert.strictEqual(notification.priority, 'normal');
});

test('createNotification resolves unknown type to SYSTEM_MESSAGE', () => {
  const notification = createNotification('BOGUS', '???');
  assert.strictEqual(notification.type, NOTIFICATION_TYPES.SYSTEM_MESSAGE);
});

test('createNotification resolves invalid priority to normal', () => {
  const notification = createNotification(NOTIFICATION_TYPES.SYSTEM_MESSAGE, 'Hello', { priority: 'mega' });
  assert.strictEqual(notification.priority, 'normal');
});

test('addNotification adds to state', () => {
  const state = { notifications: [] };
  const notification = createNotification(NOTIFICATION_TYPES.SYSTEM_MESSAGE, 'Hello');
  const newState = addNotification(state, notification);
  assert.strictEqual(newState.notifications.length, 1);
  assert.strictEqual(newState.notifications[0], notification);
});

test('addNotification initializes array if missing', () => {
  const state = {};
  const notification = createNotification(NOTIFICATION_TYPES.SYSTEM_MESSAGE, 'Hello');
  const newState = addNotification(state, notification);
  assert.ok(Array.isArray(newState.notifications));
  assert.strictEqual(newState.notifications.length, 1);
});

test('expireNotifications removes old toasts', () => {
  const notification = createNotification(NOTIFICATION_TYPES.SYSTEM_MESSAGE, 'Old', { duration: 1000, timestamp: 0 });
  const state = { notifications: [notification] };
  const newState = expireNotifications(state, 2000);
  assert.strictEqual(newState.notifications.length, 0);
});

test('expireNotifications keeps active toasts', () => {
  const notification = createNotification(NOTIFICATION_TYPES.SYSTEM_MESSAGE, 'Active', { duration: 5000, timestamp: 0 });
  const state = { notifications: [notification] };
  const newState = expireNotifications(state, 1000);
  assert.strictEqual(newState.notifications.length, 1);
});

test('renderNotificationToasts returns empty string for no notifications', () => {
  const state = { notifications: [] };
  const html = renderNotificationToasts(state);
  assert.strictEqual(html, '');
});

test('renderNotificationToasts renders visible toasts', () => {
  const notification = createNotification(NOTIFICATION_TYPES.ITEM_PICKUP, 'Got a sword');
  const state = { notifications: [notification] };
  const html = renderNotificationToasts(state);
  assert.ok(html.includes('notification-toast'));
  assert.ok(html.includes('Got a sword'));
});

test('renderNotificationToasts limits to 5 visible', () => {
  const notifications = Array.from({ length: 8 }, (_, i) =>
    createNotification(NOTIFICATION_TYPES.SYSTEM_MESSAGE, `Toast ${i + 1}`, { timestamp: i * 1000 })
  );
  const state = { notifications };
  const html = renderNotificationToasts(state);
  // Count individual toast divs (class="notification-toast" without the container)
  const toastDivs = (html.match(/class="notification-toast[ "]/g) || []).length;
  assert.strictEqual(toastDivs, 5);
});

test('getNotificationToastStyles returns CSS string', () => {
  const css = getNotificationToastStyles();
  assert.strictEqual(typeof css, 'string');
  assert.ok(css.includes('.notification-toast'));
});

test('renderNotificationToasts escapes HTML in message', () => {
  const notification = createNotification(NOTIFICATION_TYPES.SYSTEM_MESSAGE, '<script>alert(1)</script>');
  const state = { notifications: [notification] };
  const html = renderNotificationToasts(state);
  assert.ok(!html.includes('<script>alert'));
  assert.ok(html.includes('&lt;script&gt;'));
});

test('createNotification uses type-specific icon', () => {
  const notification = createNotification(NOTIFICATION_TYPES.ITEM_PICKUP, 'Found item');
  assert.ok(notification.icon, 'Should have an icon');
});

test('addNotification does not mutate original state', () => {
  const state = { notifications: [] };
  const notification = createNotification(NOTIFICATION_TYPES.SYSTEM_MESSAGE, 'Test');
  const newState = addNotification(state, notification);
  assert.strictEqual(state.notifications.length, 0, 'Original should not be mutated');
  assert.strictEqual(newState.notifications.length, 1);
});

let passed = 0;
let failed = 0;
for (const t of tests) {
  try {
    t.fn();
    passed++;
    console.log(`  ✓ ${t.name}`);
  } catch (e) {
    failed++;
    console.error(`  ✗ ${t.name}: ${e.message}`);
  }
}
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
