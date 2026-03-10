/**
 * Save Management UI Behavior Tests
 *
 * Focuses on the pure rendering behavior of src/save-management-ui.js:
 * - Correct labeling of manual vs auto-save slot
 * - Fallbacks for player name, level, class, location, and turn
 * - Defensive HTML escaping for user-controlled strings
 * - Basic structure of the full management panel
 *
 * Run: node tests/save-management-ui-behavior-test.mjs
 */

import { AUTOSAVE_SLOT } from '../src/save-system.js';
import { renderSaveSlotCard, renderSaveManagementPanel } from '../src/save-management-ui.js';

if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map();
  globalThis.localStorage = {
    getItem(key) { return store.has(String(key)) ? store.get(String(key)) : null; },
    setItem(key, value) { store.set(String(key), String(value)); },
    removeItem(key) { store.delete(String(key)); },
    clear() { store.clear(); },
    key(i) { return Array.from(store.keys())[i] ?? null; },
    get length() { return store.size; },
  };
}

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

function assertIncludes(haystack, needle, msg) {
  assert(haystack.includes(needle), `${msg} (expected to include "${needle}")`);
}

function assertNotIncludes(haystack, needle, msg) {
  assert(!haystack.includes(needle), `${msg} (expected NOT to include "${needle}")`);
}

console.log('\n=== Save Management UI Behavior Tests ===');

// ========== renderSaveSlotCard: manual slot basic rendering ==========
console.log('\n--- renderSaveSlotCard (manual slot basics) ---');
{
  const slot = {
    index: 0,
    exists: true,
    savedAt: '2026-03-10T10:00:00Z',
    customName: 'HeroOne',
    playerLevel: 7,
    playerClass: 'Warrior',
    location: 'Ancient Ruins',
    turn: 42,
  };

  const html = renderSaveSlotCard(slot);

  assert(typeof html === 'string', 'returns a string for manual slot');
  assertIncludes(html, 'data-slot-index="0"', 'includes correct slot index attribute');
  assertIncludes(html, 'Slot 1', 'labels slot 0 as "Slot 1"');
  assertIncludes(html, 'HeroOne', 'renders customName as display name');
  assertIncludes(html, 'Lv 7', 'renders player level with Lv prefix');
  assertIncludes(html, 'Warrior', 'renders player class');
  assertIncludes(html, 'Ancient Ruins', 'renders location');
  assertIncludes(html, 'Turn 42', 'renders turn value');

  // Manual slot should have a Save button
  assertIncludes(html, 'data-save-action="save"', 'manual slot includes a save button');
}

// ========== renderSaveSlotCard: auto-save slot basics ==========
console.log('\n--- renderSaveSlotCard (auto-save slot basics) ---');
{
  const slot = {
    index: AUTOSAVE_SLOT,
    exists: true,
    savedAt: '2026-03-10T11:00:00Z',
    playerName: 'AutosaveHero',
    playerLevel: 5,
    playerClass: 'Mage',
    location: 'Safe Room',
    turn: 10,
  };

  const html = renderSaveSlotCard(slot);

  assertIncludes(html, 'data-slot-index="' + AUTOSAVE_SLOT + '"', 'auto-save card has correct slot index');
  assertIncludes(html, 'Auto-Save', 'auto-save slot uses "Auto-Save" label');
  assertIncludes(html, 'AutosaveHero', 'renders playerName for auto-save slot');

  // Auto-save slot must NOT offer a manual Save button
  assertNotIncludes(html, 'data-save-action="save"', 'auto-save slot has no manual save button');

  // But load/delete/rename/export actions should still be present
  assertIncludes(html, 'data-save-action="load"', 'auto-save slot has load action');
  assertIncludes(html, 'data-save-action="delete"', 'auto-save slot has delete action');
  assertIncludes(html, 'data-save-action="rename"', 'auto-save slot has rename action');
  assertIncludes(html, 'data-save-action="export"', 'auto-save slot has export action');
}

// ========== renderSaveSlotCard: existence and Empty state ==========
console.log('\n--- renderSaveSlotCard (empty slot state) ---');
{
  const emptyExplicit = {
    index: 2,
    exists: false,
  };

  const emptyImplicit = {
    index: 3,
    savedAt: null,
  };

  const htmlExplicit = renderSaveSlotCard(emptyExplicit);
  const htmlImplicit = renderSaveSlotCard(emptyImplicit);

  assertIncludes(htmlExplicit, 'Empty', 'explicit empty slot shows "Empty" text');
  assertIncludes(htmlImplicit, 'Empty', 'implicit empty slot (no savedAt) shows "Empty" text');

  // Empty slots should disable load/delete/rename/export controls
  for (const html of [htmlExplicit, htmlImplicit]) {
    assertIncludes(html, 'data-save-action="load"', 'empty slot still renders load button');
    assertIncludes(html, 'data-save-action="delete"', 'empty slot still renders delete button');
    assertIncludes(html, 'data-save-action="rename"', 'empty slot still renders rename button');
    assertIncludes(html, 'data-save-action="export"', 'empty slot still renders export button');

    const disabledCount = (html.match(/disabled/g) || []).length;
    assert(disabledCount >= 1, 'empty slot marks actions as disabled');
  }
}

// ========== renderSaveSlotCard: fallback paths ==========
console.log('\n--- renderSaveSlotCard (fallbacks) ---');
{
  // Name fallbacks: customName > playerName > player.name > Unknown Hero
  const byCustomName = renderSaveSlotCard({ index: 0, exists: true, customName: 'Custom', playerName: 'Base', player: { name: 'Inner' } });
  const byPlayerName = renderSaveSlotCard({ index: 1, exists: true, playerName: 'BaseOnly', player: { name: 'Inner' } });
  const byInnerName = renderSaveSlotCard({ index: 2, exists: true, player: { name: 'InnerOnly' } });
  const unknownName = renderSaveSlotCard({ index: 3, exists: true });

  assertIncludes(byCustomName, 'Custom', 'uses customName when present and non-empty');
  assertIncludes(byPlayerName, 'BaseOnly', 'uses playerName when customName missing');
  assertIncludes(byInnerName, 'InnerOnly', 'uses player.name when playerName missing');
  assertIncludes(unknownName, 'Unknown Hero', 'falls back to "Unknown Hero" when no names');

  // Level fallbacks: playerLevel > player.level > Lv ?
  const byPlayerLevel = renderSaveSlotCard({ index: 0, exists: true, playerLevel: 9 });
  const byInnerLevel = renderSaveSlotCard({ index: 1, exists: true, player: { level: 3 } });
  const unknownLevel = renderSaveSlotCard({ index: 2, exists: true });

  assertIncludes(byPlayerLevel, 'Lv 9', 'uses playerLevel field when provided');
  assertIncludes(byInnerLevel, 'Lv 3', 'uses player.level when playerLevel missing');
  assertIncludes(unknownLevel, 'Lv ?', 'falls back to Lv ? when no level info');

  // Class fallbacks: playerClass > player.classId > player.class > Adventurer
  const byPlayerClass = renderSaveSlotCard({ index: 0, exists: true, playerClass: 'Rogue' });
  const byClassId = renderSaveSlotCard({ index: 1, exists: true, player: { classId: 'Cleric' } });
  const byClass = renderSaveSlotCard({ index: 2, exists: true, player: { class: 'Arcanist' } });
  const defaultClass = renderSaveSlotCard({ index: 3, exists: true });

  assertIncludes(byPlayerClass, 'Rogue', 'uses playerClass when provided');
  assertIncludes(byClassId, 'Cleric', 'uses player.classId when playerClass missing');
  assertIncludes(byClass, 'Arcanist', 'uses player.class when classId missing');
  assertIncludes(defaultClass, 'Adventurer', 'falls back to "Adventurer" when no class info');

  // Location fallbacks: location > saveMetadata.location > Unknown Location
  const byLocation = renderSaveSlotCard({ index: 0, exists: true, location: 'Crystal Cavern' });
  const byMetadata = renderSaveSlotCard({ index: 1, exists: true, saveMetadata: { location: 'Hidden Grove' } });
  const defaultLocation = renderSaveSlotCard({ index: 2, exists: true });

  assertIncludes(byLocation, 'Crystal Cavern', 'uses location field when provided');
  assertIncludes(byMetadata, 'Hidden Grove', 'uses saveMetadata.location when location missing');
  assertIncludes(defaultLocation, 'Unknown Location', 'falls back to "Unknown Location"');

  // Turn fallbacks: turn > saveMetadata.turn > 0
  const byTurn = renderSaveSlotCard({ index: 0, exists: true, turn: 99 });
  const byTurnMetadata = renderSaveSlotCard({ index: 1, exists: true, saveMetadata: { turn: 12 } });
  const defaultTurn = renderSaveSlotCard({ index: 2, exists: true });

  assertIncludes(byTurn, 'Turn 99', 'uses top-level turn when provided');
  assertIncludes(byTurnMetadata, 'Turn 12', 'uses saveMetadata.turn when top-level turn missing');
  assertIncludes(defaultTurn, 'Turn 0', 'falls back to Turn 0 when no turn info');
}

// ========== renderSaveSlotCard: XSS and HTML escaping ==========
console.log('\n--- renderSaveSlotCard (escaping) ---');
{
  const dangerous = {
    index: 0,
    exists: true,
    customName: '<script>alert("xss")</script>',
    playerClass: 'Mage & Thief',
    location: 'Castle > Keep',
  };

  const html = renderSaveSlotCard(dangerous);

  // Raw dangerous sequences must not appear
  assertNotIncludes(html, '<script>', 'script tag is escaped');
  assertNotIncludes(html, '</script>', 'closing script tag is escaped');
  assertNotIncludes(html, '"xss"', 'quotes are HTML-escaped');

  // Escaped equivalents should appear
  assertIncludes(html, '&lt;script&gt;', 'opening script tag is HTML-escaped');
  assertIncludes(html, '&lt;/script&gt;', 'closing script tag is HTML-escaped');
  assertIncludes(html, '&quot;xss&quot;', 'double quotes are HTML-escaped');
  assertIncludes(html, 'Mage &amp; Thief', 'ampersand is escaped');
  assertIncludes(html, 'Castle &gt; Keep', 'greater-than is escaped');
}

// ========== renderSaveManagementPanel: basic structure ==========
console.log('\n--- renderSaveManagementPanel (structure) ---');
{
  const panel = renderSaveManagementPanel();
  assert(typeof panel === 'string', 'renderSaveManagementPanel returns a string');

  assertIncludes(panel, 'save-panel-header', 'panel includes header section');
  assertIncludes(panel, 'save-panel-title', 'panel includes title element');
  assertIncludes(panel, 'Save Management', 'panel title text is present');
  assertIncludes(panel, 'save-autosave-checkbox', 'panel includes autosave checkbox');
  assertIncludes(panel, 'save-import-input', 'panel includes import file input');
  assertIncludes(panel, 'save-slot-grid', 'panel includes slot grid container');
}

console.log(`\nSave Management UI Behavior Tests: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
