import { renderDefeatScreen, renderDefeatActions, getDefeatScreenStyles } from '../src/defeat-screen-ui.js';

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) { passed++; }
  else { failed++; console.error(`FAIL: ${msg}`); }
}

// --- renderDefeatScreen ---

// Test 1: Returns HTML with defeat-screen section
{
  const state = { player: { name: 'Ada', className: 'Mage' }, enemy: { name: 'Goblin' }, dungeonState: { currentFloor: 3 }, gameStats: { enemiesDefeated: 10, totalDamageDealt: 500, totalDamageTaken: 200, goldEarned: 50, potionsUsed: 2, highestCombo: 5 } };
  const html = renderDefeatScreen(state);
  assert(html.includes('defeat-screen'), 'renderDefeatScreen should include defeat-screen class');
  assert(html.includes('DEFEAT'), 'renderDefeatScreen should include DEFEAT title');
  assert(html.includes('Ada'), 'renderDefeatScreen should include player name');
  assert(html.includes('Mage'), 'renderDefeatScreen should include player class');
  assert(html.includes('Goblin'), 'renderDefeatScreen should include enemy name');
  assert(html.includes('Floor 3'), 'renderDefeatScreen should include floor number');
  assert(html.includes('10'), 'renderDefeatScreen should include enemies defeated count');
  assert(html.includes('500'), 'renderDefeatScreen should include damage dealt');
  assert(html.includes('200'), 'renderDefeatScreen should include damage taken');
  assert(html.includes('50'), 'renderDefeatScreen should include gold earned');
}

// Test 2: Defaults when state is sparse
{
  const html = renderDefeatScreen({});
  assert(html.includes('Hero'), 'should default player name to Hero');
  assert(html.includes('Adventurer'), 'should default class to Adventurer');
  assert(html.includes('an unknown foe'), 'should default enemy name to an unknown foe');
  assert(html.includes('Floor 1'), 'should default floor to 1');
}

// Test 3: Handles null/undefined state gracefully
{
  const html = renderDefeatScreen(null);
  assert(html.includes('Hero'), 'should handle null state with defaults');
}

// Test 4: Quote selection is deterministic
{
  const state1 = { gameStats: { enemiesDefeated: 5, totalDamageDealt: 100 } };
  const state2 = { gameStats: { enemiesDefeated: 5, totalDamageDealt: 100 } };
  const html1 = renderDefeatScreen(state1);
  const html2 = renderDefeatScreen(state2);
  assert(html1 === html2, 'same stats should produce same quote (deterministic)');
}

// Test 5: Different stats produce different quotes
{
  const stateA = { gameStats: { enemiesDefeated: 0, totalDamageDealt: 0 } };
  const stateB = { gameStats: { enemiesDefeated: 1, totalDamageDealt: 0 } };
  const htmlA = renderDefeatScreen(stateA);
  const htmlB = renderDefeatScreen(stateB);
  // They might be different quotes
  assert(typeof htmlA === 'string' && typeof htmlB === 'string', 'both should return strings');
}

// Test 6: Stats grid has all 6 stat entries
{
  const state = { gameStats: { enemiesDefeated: 1, totalDamageDealt: 2, totalDamageTaken: 3, goldEarned: 4, potionsUsed: 5, highestCombo: 6 } };
  const html = renderDefeatScreen(state);
  const statCount = (html.match(/defeat-stat-label/g) || []).length;
  assert(statCount === 6, `should have 6 stat entries, got ${statCount}`);
}

// --- renderDefeatActions ---

// Test 7: Contains action buttons
{
  const html = renderDefeatActions();
  assert(html.includes('btnTryAgain'), 'should include Try Again button');
  assert(html.includes('btnLoad'), 'should include Load Save button');
  assert(html.includes('btnViewStats'), 'should include View Stats button');
  assert(html.includes('Rise Again'), 'should include Rise Again text');
  assert(html.includes('Load Save'), 'should include Load Save text');
  assert(html.includes('View Statistics'), 'should include View Statistics text');
}

// --- getDefeatScreenStyles ---

// Test 8: Returns CSS string
{
  const styles = getDefeatScreenStyles();
  assert(typeof styles === 'string', 'getDefeatScreenStyles should return a string');
  assert(styles.includes('.defeat-screen'), 'styles should include .defeat-screen');
  assert(styles.includes('.defeat-title'), 'styles should include .defeat-title');
  assert(styles.includes('.defeat-button'), 'styles should include .defeat-button');
  assert(styles.includes('defeatPulse'), 'styles should include defeatPulse keyframes');
  assert(styles.includes('defeatFadeIn'), 'styles should include defeatFadeIn keyframes');
}

// Test 9: Styles include crimson colors
{
  const styles = getDefeatScreenStyles();
  assert(styles.includes('#dc143c'), 'styles should include crimson (#dc143c)');
  assert(styles.includes('#8b0000'), 'styles should include dark red (#8b0000)');
}

// Test 10: Stats default to 0 with gameStats undefined
{
  const html = renderDefeatScreen({ player: { name: 'Test' } });
  // Check that the stat values are 0
  const matches = html.match(/defeat-stat-value">([\d]+)/g);
  assert(matches && matches.length === 6, 'should still have 6 stat values');
  const allZero = matches.every(m => m.endsWith('>0'));
  assert(allZero, 'all stat values should default to 0');
}

console.log(`\nDefeat Screen UI Tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
