/**
 * Save Slots Integration Tests
 * Tests that dispatch actions (SAVE_SLOTS, LOAD_SLOTS, SAVE_TO_SLOT,
 * LOAD_FROM_SLOT, DELETE_SAVE_SLOT, CLOSE_SAVE_SLOTS, SWITCH_SAVE_MODE)
 * correctly transition game state via engine.js save functions.
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { saveToSlot, loadFromSlot, getSaveSlots, deleteSaveSlot } from '../src/engine.js';

// Minimal localStorage polyfill for Node
const store = {};
if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = {
    getItem(k) { return store[k] ?? null; },
    setItem(k, v) { store[k] = String(v); },
    removeItem(k) { delete store[k]; },
    clear() { for (const k in store) delete store[k]; }
  };
}

function clearSlots() {
  for (let i = 0; i < 5; i++) {
    localStorage.removeItem('aiVillageRpg_slot_' + i);
  }
}

function makeState(overrides = {}) {
  return {
    phase: 'exploration',
    player: { name: 'TestHero', hp: 50, maxHp: 50, level: 3 },
    turn: 10,
    log: ['Test log entry'],
    ...overrides
  };
}

// Simulate dispatch logic from main.js
function simulateDispatch(state, action) {
  const type = action.type;

  if (type === 'SAVE_SLOTS') {
    return { ...state, phase: 'save-slots', saveSlotMode: 'save', saveSlots: getSaveSlots() };
  }
  if (type === 'LOAD_SLOTS') {
    return { ...state, phase: 'save-slots', saveSlotMode: 'load', saveSlots: getSaveSlots() };
  }
  if (type === 'SAVE_TO_SLOT') {
    const slotIndex = action.slotIndex;
    const success = saveToSlot(state, slotIndex);
    if (success) {
      return { ...state, phase: 'save-slots', saveSlotMode: 'save', saveSlots: getSaveSlots(), log: [...(state.log || []), 'Saved to slot ' + (slotIndex + 1) + '.'] };
    }
    return { ...state, phase: 'save-slots', saveSlotMode: 'save', saveSlots: getSaveSlots(), log: [...(state.log || []), 'Save failed!'] };
  }
  if (type === 'LOAD_FROM_SLOT') {
    const slotIndex = action.slotIndex;
    const loaded = loadFromSlot(slotIndex);
    if (loaded) {
      return { ...loaded, phase: 'exploration', log: [...(loaded.log || []), 'Loaded from slot ' + (slotIndex + 1) + '.'] };
    }
    return { ...state, phase: 'save-slots', saveSlotMode: 'load', saveSlots: getSaveSlots(), log: [...(state.log || []), 'Load failed! Slot may be empty.'] };
  }
  if (type === 'DELETE_SAVE_SLOT') {
    deleteSaveSlot(action.slotIndex);
    return { ...state, phase: 'save-slots', saveSlotMode: state.saveSlotMode || 'save', saveSlots: getSaveSlots(), log: [...(state.log || []), 'Slot ' + (action.slotIndex + 1) + ' deleted.'] };
  }
  if (type === 'CLOSE_SAVE_SLOTS') {
    return { ...state, phase: 'exploration' };
  }
  if (type === 'SWITCH_SAVE_MODE') {
    return { ...state, saveSlotMode: action.mode, saveSlots: getSaveSlots() };
  }
  return state;
}

let pass = 0;
let fail = 0;
function check(label, condition) {
  if (condition) {
    console.log('  PASS: ' + label);
    pass++;
  } else {
    console.log('  FAIL: ' + label);
    fail++;
  }
}

// --- SAVE_SLOTS ---
console.log('# --- SAVE_SLOTS action ---');
clearSlots();
{
  const s = makeState();
  const next = simulateDispatch(s, { type: 'SAVE_SLOTS' });
  check('phase becomes save-slots', next.phase === 'save-slots');
  check('saveSlotMode is save', next.saveSlotMode === 'save');
  check('saveSlots is array', Array.isArray(next.saveSlots));
  check('saveSlots has 5 entries', next.saveSlots.length === 5);
  check('all slots empty initially', next.saveSlots.every(s => !s.exists));
}

// --- LOAD_SLOTS ---
console.log('# --- LOAD_SLOTS action ---');
clearSlots();
{
  const s = makeState();
  const next = simulateDispatch(s, { type: 'LOAD_SLOTS' });
  check('phase becomes save-slots', next.phase === 'save-slots');
  check('saveSlotMode is load', next.saveSlotMode === 'load');
  check('saveSlots is array', Array.isArray(next.saveSlots));
}

// --- SAVE_TO_SLOT ---
console.log('# --- SAVE_TO_SLOT action ---');
clearSlots();
{
  const s = makeState({ phase: 'save-slots', saveSlotMode: 'save' });
  const next = simulateDispatch(s, { type: 'SAVE_TO_SLOT', slotIndex: 0 });
  check('stays in save-slots phase', next.phase === 'save-slots');
  check('log includes saved message', next.log.some(l => l.includes('Saved to slot 1')));
  check('slot 0 now exists', next.saveSlots[0].exists);
  check('slot 0 has playerName', next.saveSlots[0].playerName === 'TestHero');
}

console.log('# --- SAVE_TO_SLOT multiple slots ---');
clearSlots();
{
  const s = makeState({ phase: 'save-slots', saveSlotMode: 'save' });
  simulateDispatch(s, { type: 'SAVE_TO_SLOT', slotIndex: 0 });
  simulateDispatch(s, { type: 'SAVE_TO_SLOT', slotIndex: 2 });
  simulateDispatch(s, { type: 'SAVE_TO_SLOT', slotIndex: 4 });
  const slots = getSaveSlots();
  check('slot 0 exists', slots[0].exists);
  check('slot 1 empty', !slots[1].exists);
  check('slot 2 exists', slots[2].exists);
  check('slot 3 empty', !slots[3].exists);
  check('slot 4 exists', slots[4].exists);
}

console.log('# --- SAVE_TO_SLOT invalid index ---');
clearSlots();
{
  const s = makeState({ phase: 'save-slots', saveSlotMode: 'save' });
  const next = simulateDispatch(s, { type: 'SAVE_TO_SLOT', slotIndex: 10 });
  check('log includes failed message', next.log.some(l => l.includes('Save failed!')));
}

// --- LOAD_FROM_SLOT ---
console.log('# --- LOAD_FROM_SLOT action ---');
clearSlots();
{
  const s = makeState({ phase: 'save-slots', saveSlotMode: 'save' });
  simulateDispatch(s, { type: 'SAVE_TO_SLOT', slotIndex: 1 });

  const loadState = makeState({ phase: 'save-slots', saveSlotMode: 'load', turn: 99 });
  const next = simulateDispatch(loadState, { type: 'LOAD_FROM_SLOT', slotIndex: 1 });
  check('phase returns to exploration', next.phase === 'exploration');
  check('loaded state has original turn', next.turn === 10);
  check('log includes loaded message', next.log.some(l => l.includes('Loaded from slot 2')));
}

console.log('# --- LOAD_FROM_SLOT empty slot ---');
clearSlots();
{
  const s = makeState({ phase: 'save-slots', saveSlotMode: 'load' });
  const next = simulateDispatch(s, { type: 'LOAD_FROM_SLOT', slotIndex: 3 });
  check('stays in save-slots phase', next.phase === 'save-slots');
  check('log includes failed message', next.log.some(l => l.includes('Load failed!')));
}

// --- DELETE_SAVE_SLOT ---
console.log('# --- DELETE_SAVE_SLOT action ---');
clearSlots();
{
  const s = makeState({ phase: 'save-slots', saveSlotMode: 'save' });
  simulateDispatch(s, { type: 'SAVE_TO_SLOT', slotIndex: 2 });
  const afterSave = getSaveSlots();
  check('slot 2 exists before delete', afterSave[2].exists);

  const next = simulateDispatch({ ...s, saveSlots: afterSave }, { type: 'DELETE_SAVE_SLOT', slotIndex: 2 });
  check('stays in save-slots phase', next.phase === 'save-slots');
  check('slot 2 gone after delete', !next.saveSlots[2].exists);
  check('log includes deleted message', next.log.some(l => l.includes('Slot 3 deleted')));
}

// --- CLOSE_SAVE_SLOTS ---
console.log('# --- CLOSE_SAVE_SLOTS action ---');
{
  const s = makeState({ phase: 'save-slots', saveSlotMode: 'save', saveSlots: [] });
  const next = simulateDispatch(s, { type: 'CLOSE_SAVE_SLOTS' });
  check('phase returns to exploration', next.phase === 'exploration');
}

// --- SWITCH_SAVE_MODE ---
console.log('# --- SWITCH_SAVE_MODE action ---');
clearSlots();
{
  const s = makeState({ phase: 'save-slots', saveSlotMode: 'save' });
  const next = simulateDispatch(s, { type: 'SWITCH_SAVE_MODE', mode: 'load' });
  check('saveSlotMode switched to load', next.saveSlotMode === 'load');
  check('saveSlots refreshed', Array.isArray(next.saveSlots));

  const next2 = simulateDispatch(next, { type: 'SWITCH_SAVE_MODE', mode: 'save' });
  check('saveSlotMode switched back to save', next2.saveSlotMode === 'save');
}

// --- Round-trip save and load ---
console.log('# --- Round-trip: save, switch mode, load ---');
clearSlots();
{
  const s = makeState({ phase: 'save-slots', saveSlotMode: 'save' });
  const afterSave = simulateDispatch(s, { type: 'SAVE_TO_SLOT', slotIndex: 0 });
  check('saved successfully', afterSave.saveSlots[0].exists);

  const switched = simulateDispatch(afterSave, { type: 'SWITCH_SAVE_MODE', mode: 'load' });
  check('mode is now load', switched.saveSlotMode === 'load');

  const loaded = simulateDispatch(switched, { type: 'LOAD_FROM_SLOT', slotIndex: 0 });
  check('loaded phase is exploration', loaded.phase === 'exploration');
  check('loaded player name matches', loaded.player?.name === 'TestHero');
  check('loaded turn matches', loaded.turn === 10);
}

// --- Overwrite existing slot ---
console.log('# --- Overwrite existing slot ---');
clearSlots();
{
  const s1 = makeState({ phase: 'save-slots', saveSlotMode: 'save', turn: 5 });
  simulateDispatch(s1, { type: 'SAVE_TO_SLOT', slotIndex: 0 });
  
  const s2 = makeState({ phase: 'save-slots', saveSlotMode: 'save', turn: 99, player: { name: 'NewHero', hp: 100, maxHp: 100, level: 10 } });
  const after = simulateDispatch(s2, { type: 'SAVE_TO_SLOT', slotIndex: 0 });
  check('slot still exists', after.saveSlots[0].exists);
  check('slot has updated player name', after.saveSlots[0].playerName === 'NewHero');
  check('slot has updated turn', after.saveSlots[0].turn === 99);
}

console.log('\n# === RESULTS ===');
console.log('# pass: ' + pass);
console.log('# fail: ' + fail);
console.log('# total: ' + (pass + fail));

if (fail > 0) {
  process.exit(1);
}
