/**
 * Combat Log Formatter Tests
 * Tests for src/combat-log-formatter.js module
 * Created by Claude Opus 4.6 (Day 343)
 */

import {
  escapeHtml,
  classifyLogEntry,
  formatLogEntryHtml,
  renderFormattedLog,
  getLogStyles
} from '../src/combat-log-formatter.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ❌ ${name}: ${e.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'assertion failed');
}

function assertEqual(a, b, msg) {
  if (a !== b) throw new Error(msg || `expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

// =========================================================
// escapeHtml tests
// =========================================================
console.log('\nescapeHtml():');

test('escapes ampersand', () => {
  assertEqual(escapeHtml('A & B'), 'A &amp; B');
});

test('escapes less-than', () => {
  assertEqual(escapeHtml('<script>'), '&lt;script&gt;');
});

test('escapes double quotes', () => {
  assertEqual(escapeHtml('"hello"'), '&quot;hello&quot;');
});

test('handles empty string', () => {
  assertEqual(escapeHtml(''), '');
});

test('converts non-string to string', () => {
  assertEqual(escapeHtml(42), '42');
});

test('handles null', () => {
  assertEqual(escapeHtml(null), 'null');
});

test('handles multiple special chars', () => {
  assertEqual(escapeHtml('<b>"A & B"</b>'), '&lt;b&gt;&quot;A &amp; B&quot;&lt;/b&gt;');
});

// =========================================================
// classifyLogEntry tests — damage dealt
// =========================================================
console.log('\nclassifyLogEntry() — damage dealt:');

test('player attack classified as damage-dealt', () => {
  const r = classifyLogEntry('You strike the Goblin for 12 damage!');
  assertEqual(r.type, 'damage-dealt');
});

test('player deals damage', () => {
  const r = classifyLogEntry('You deal 8 damage to Slime');
  assertEqual(r.type, 'damage-dealt');
});

test('player hits for damage', () => {
  const r = classifyLogEntry('Player hits for 15 damage');
  assertEqual(r.type, 'damage-dealt');
});

test('your attack classified as damage-dealt', () => {
  const r = classifyLogEntry('Your attack deals 10 damage');
  assertEqual(r.type, 'damage-dealt');
});

// =========================================================
// classifyLogEntry tests — damage received
// =========================================================
console.log('\nclassifyLogEntry() — damage received:');

test('enemy attack classified as damage-received', () => {
  const r = classifyLogEntry('Goblin attacks for 5 damage!');
  assertEqual(r.type, 'damage-received');
});

test('enemy hits you classified as damage-received', () => {
  const r = classifyLogEntry('Slime hits for 3 damage');
  assertEqual(r.type, 'damage-received');
});

test('generic damage without player context', () => {
  const r = classifyLogEntry('The enemy deals 7 damage');
  assertEqual(r.type, 'damage-received');
});

// =========================================================
// classifyLogEntry tests — healing
// =========================================================
console.log('\nclassifyLogEntry() — healing:');

test('heal classified correctly', () => {
  const r = classifyLogEntry('You heal for 20 HP');
  assertEqual(r.type, 'healing');
});

test('restored classified as healing', () => {
  const r = classifyLogEntry('HP restored by 15');
  assertEqual(r.type, 'healing');
});

test('regeneration classified as healing', () => {
  const r = classifyLogEntry('Regeneration restores 5 HP');
  assertEqual(r.type, 'healing');
});

test('recover classified as healing', () => {
  const r = classifyLogEntry('You recover 10 HP');
  assertEqual(r.type, 'healing');
});

// =========================================================
// classifyLogEntry tests — status effects
// =========================================================
console.log('\nclassifyLogEntry() — status effects:');

test('poison classified as status-effect', () => {
  const r = classifyLogEntry('You are poisoned!');
  assertEqual(r.type, 'status-effect');
});

test('burning classified as status-effect', () => {
  const r = classifyLogEntry('The enemy is burning');
  assertEqual(r.type, 'status-effect');
});

test('stunned classified as status-effect', () => {
  const r = classifyLogEntry('Goblin is stunned for 2 turns');
  assertEqual(r.type, 'status-effect');
});

test('frozen classified as status-effect', () => {
  const r = classifyLogEntry('The slime is frozen solid');
  assertEqual(r.type, 'status-effect');
});

test('bleeding classified as status-effect', () => {
  const r = classifyLogEntry('You are bleeding');
  assertEqual(r.type, 'status-effect');
});

// =========================================================
// classifyLogEntry tests — shield
// =========================================================
console.log('\nclassifyLogEntry() — shield:');

test('shield classified correctly', () => {
  const r = classifyLogEntry('Shield absorbs 5 damage');
  assertEqual(r.type, 'shield');
});

test('blocked classified as shield', () => {
  const r = classifyLogEntry('Attack blocked!');
  assertEqual(r.type, 'shield');
});

test('shatter classified as shield', () => {
  const r = classifyLogEntry('Shield shattered!');
  assertEqual(r.type, 'shield');
});

test('break classified as shield', () => {
  const r = classifyLogEntry('Shield break successful!');
  assertEqual(r.type, 'shield');
});

// =========================================================
// classifyLogEntry tests — flee
// =========================================================
console.log('\nclassifyLogEntry() — flee:');

test('flee classified correctly', () => {
  const r = classifyLogEntry('You flee from combat!');
  assertEqual(r.type, 'flee');
});

test('escaped classified as flee', () => {
  const r = classifyLogEntry('You escaped successfully!');
  assertEqual(r.type, 'flee');
});

test('ran away classified as flee', () => {
  const r = classifyLogEntry('You ran away from the enemy');
  assertEqual(r.type, 'flee');
});

test('retreated classified as flee', () => {
  const r = classifyLogEntry('You retreated from battle');
  assertEqual(r.type, 'flee');
});

// =========================================================
// classifyLogEntry tests — victory / defeat
// =========================================================
console.log('\nclassifyLogEntry() — victory/defeat:');

test('enemy defeated classified as victory', () => {
  const r = classifyLogEntry('Goblin has been defeated!');
  assertEqual(r.type, 'victory');
});

test('enemy slain classified as victory', () => {
  const r = classifyLogEntry('Goblin was slain!');
  assertEqual(r.type, 'victory');
});

test('victory keyword', () => {
  const r = classifyLogEntry('Victory! You won the battle!');
  assertEqual(r.type, 'victory');
});

test('level up classified as victory', () => {
  const r = classifyLogEntry('Level up! You reached level 5!');
  assertEqual(r.type, 'victory');
});

test('player defeat classified as defeat', () => {
  const r = classifyLogEntry('You have been defeated');
  assertEqual(r.type, 'defeat');
});

test('player died classified as defeat', () => {
  const r = classifyLogEntry('You died in battle');
  assertEqual(r.type, 'defeat');
});

test('player fallen classified as defeat', () => {
  const r = classifyLogEntry('You have fallen in combat');
  assertEqual(r.type, 'defeat');
});

// =========================================================
// classifyLogEntry tests — companion
// =========================================================
console.log('\nclassifyLogEntry() — companion:');

test('companion classified correctly', () => {
  const r = classifyLogEntry('Your companion attacks for 8 damage');
  assertEqual(r.type, 'companion');
});

test('ally classified as companion', () => {
  const r = classifyLogEntry('Your ally heals you for 5 HP');
  assertEqual(r.type, 'companion');
});

// =========================================================
// classifyLogEntry tests — item
// =========================================================
console.log('\nclassifyLogEntry() — item:');

test('potion classified as item', () => {
  const r = classifyLogEntry('You drink a potion');
  assertEqual(r.type, 'item');
});

test('use item classified as item', () => {
  const r = classifyLogEntry('You use an item in combat');
  assertEqual(r.type, 'item');
});

// =========================================================
// classifyLogEntry tests — ability
// =========================================================
console.log('\nclassifyLogEntry() — ability:');

test('cast spell classified as ability', () => {
  const r = classifyLogEntry('You cast Fireball!');
  assertEqual(r.type, 'ability');
});

test('special move classified as ability', () => {
  const r = classifyLogEntry('Special attack activated!');
  assertEqual(r.type, 'ability');
});

// =========================================================
// classifyLogEntry tests — info (default)
// =========================================================
console.log('\nclassifyLogEntry() — info:');

test('generic text classified as info', () => {
  const r = classifyLogEntry('A new encounter begins');
  assertEqual(r.type, 'info');
});

test('non-string input classified as info', () => {
  const r = classifyLogEntry(null);
  assertEqual(r.type, 'info');
});

test('undefined input classified as info', () => {
  const r = classifyLogEntry(undefined);
  assertEqual(r.type, 'info');
});

test('number input classified as info', () => {
  const r = classifyLogEntry(42);
  assertEqual(r.type, 'info');
});

// =========================================================
// classifyLogEntry tests — return shape
// =========================================================
console.log('\nclassifyLogEntry() — return shape:');

test('returns type, icon, and cssClass', () => {
  const r = classifyLogEntry('You heal for 20 HP');
  assert(typeof r.type === 'string', 'type should be string');
  assert(typeof r.icon === 'string', 'icon should be string');
  assert(typeof r.cssClass === 'string', 'cssClass should be string');
});

test('cssClass matches log- prefix', () => {
  const r = classifyLogEntry('You heal for 20 HP');
  assert(r.cssClass.startsWith('log-'), 'cssClass should start with log-');
});

// =========================================================
// formatLogEntryHtml tests
// =========================================================
console.log('\nformatLogEntryHtml():');

test('returns HTML with logLine class', () => {
  const html = formatLogEntryHtml('You strike for 10 damage');
  assert(html.includes('class="logLine'), 'should contain logLine class');
});

test('includes log-icon span', () => {
  const html = formatLogEntryHtml('You heal for 20 HP');
  assert(html.includes('class="log-icon"'), 'should contain log-icon class');
});

test('escapes HTML in log text', () => {
  const html = formatLogEntryHtml('Goblin <script>alert("xss")</script> attacks');
  assert(!html.includes('<script>'), 'should escape script tags');
  assert(html.includes('&lt;script&gt;'), 'should contain escaped script');
});

test('contains type-specific CSS class', () => {
  const html = formatLogEntryHtml('You heal for 20 HP');
  assert(html.includes('log-healing'), 'should contain log-healing class');
});

test('wraps in div element', () => {
  const html = formatLogEntryHtml('Test message');
  assert(html.startsWith('<div'), 'should start with div');
  assert(html.endsWith('</div>'), 'should end with /div');
});

// =========================================================
// renderFormattedLog tests
// =========================================================
console.log('\nrenderFormattedLog():');

test('renders array of log entries', () => {
  const html = renderFormattedLog(['You attack', 'Enemy attacks']);
  const divCount = (html.match(/<div/g) || []).length;
  assertEqual(divCount, 2, 'should have 2 div elements');
});

test('limits entries to maxEntries', () => {
  const entries = Array(100).fill('Test log line');
  const html = renderFormattedLog(entries, 10);
  const divCount = (html.match(/<div/g) || []).length;
  assertEqual(divCount, 10, 'should limit to 10 entries');
});

test('default maxEntries is 50', () => {
  const entries = Array(60).fill('Test log line');
  const html = renderFormattedLog(entries);
  const divCount = (html.match(/<div/g) || []).length;
  assertEqual(divCount, 50, 'should default to 50 max');
});

test('returns empty string for non-array', () => {
  assertEqual(renderFormattedLog(null), '');
  assertEqual(renderFormattedLog(undefined), '');
  assertEqual(renderFormattedLog('string'), '');
});

test('handles empty array', () => {
  assertEqual(renderFormattedLog([]), '');
});

// =========================================================
// getLogStyles tests
// =========================================================
console.log('\ngetLogStyles():');

test('returns a string', () => {
  assert(typeof getLogStyles() === 'string', 'should return string');
});

test('includes all log type CSS classes', () => {
  const styles = getLogStyles();
  const expectedClasses = [
    'log-damage-dealt', 'log-damage-received', 'log-healing',
    'log-status', 'log-shield', 'log-ability', 'log-flee',
    'log-victory', 'log-defeat', 'log-companion', 'log-item', 'log-info'
  ];
  for (const cls of expectedClasses) {
    assert(styles.includes(`.${cls}`), `should include .${cls}`);
  }
});

test('includes log-icon styles', () => {
  assert(getLogStyles().includes('.log-icon'), 'should include .log-icon');
});

test('includes logLine styles', () => {
  assert(getLogStyles().includes('.logLine'), 'should include .logLine');
});

// =========================================================
// Integration scenarios
// =========================================================
console.log('\nIntegration scenarios:');

test('full combat sequence renders correctly', () => {
  const log = [
    'A new encounter begins!',
    'You strike the Goblin for 12 damage!',
    'Goblin attacks for 5 damage!',
    'You are poisoned!',
    'You drink a potion',
    'You heal for 10 HP',
    'Shield absorbs 3 damage',
    'Your companion attacks for 8 damage',
    'Goblin has been defeated!'
  ];
  const html = renderFormattedLog(log);
  const divCount = (html.match(/<div/g) || []).length;
  assertEqual(divCount, 9, 'should render all 9 entries');
  assert(html.includes('log-info'), 'should have info entry');
  assert(html.includes('log-damage-dealt'), 'should have damage-dealt');
  assert(html.includes('log-damage-received'), 'should have damage-received');
  assert(html.includes('log-status'), 'should have status effect');
  assert(html.includes('log-item'), 'should have item');
  assert(html.includes('log-healing'), 'should have healing');
  assert(html.includes('log-shield'), 'should have shield');
  assert(html.includes('log-companion'), 'should have companion');
  assert(html.includes('log-victory'), 'should have victory');
});

test('XSS prevention in full render', () => {
  const log = ['<img onerror="alert(1)" src=x>', 'Normal log'];
  const html = renderFormattedLog(log);
  assert(!html.includes('<img'), 'should not contain raw img tag');
  assert(html.includes('&lt;img'), 'should escape img tag');
});

// =========================================================
// Summary
// =========================================================
console.log(`\n${'='.repeat(50)}`);
console.log(`Combat Log Formatter Tests: ${passed} passed, ${failed} failed`);
console.log(`${'='.repeat(50)}`);

if (failed > 0) process.exit(1);
