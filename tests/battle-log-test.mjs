import test from 'node:test';
import assert from 'node:assert/strict';
import { BattleLog, battleLog } from '../src/battle-log.js';
import { renderBattleLogPanel, getBattleLogStyles, renderFilterBar } from '../src/battle-log-ui.js';

test('addEntry stores entries with timestamp and turn context', () => {
  const log = new BattleLog();
  log.startTurn(1);
  const entry = log.addEntry('attack', 'Slash for 12', { damage: 12 });

  assert.equal(entry.type, 'attack');
  assert.equal(entry.turn, 1);
  assert.equal(entry.message, 'Slash for 12');
  assert.ok(typeof entry.timestamp === 'number');
  assert.equal(log.entries.at(-1), entry);
});

test('addEntry defaults details to null when omitted', () => {
  const log = new BattleLog();
  log.startTurn();
  const entry = log.addEntry('heal', 'Regenerated 5 HP');
  assert.equal(entry.details, null);
});

test('startTurn increments when no turn number is provided', () => {
  const log = new BattleLog();
  const first = log.startTurn();
  const second = log.startTurn();
  assert.equal(first, 1);
  assert.equal(second, 2);
  assert.equal(log.currentTurn, 2);
});

test('startTurn respects explicit turn number', () => {
  const log = new BattleLog();
  const turn = log.startTurn(3);
  assert.equal(turn, 3);
  const last = log.entries.at(-1);
  assert.equal(last.turn, 3);
  assert.equal(last.type, 'turn-start');
});

test('endTurn records a turn-end entry for the current turn', () => {
  const log = new BattleLog();
  log.startTurn(2);
  const endTurn = log.endTurn();
  assert.equal(endTurn, 2);
  const last = log.entries.at(-1);
  assert.equal(last.type, 'turn-end');
  assert.equal(last.turn, 2);
});

test('getCombatSummary totals damage, received damage, and healing', () => {
  const log = new BattleLog();
  log.startTurn(1);
  log.addEntry('damage-dealt', 'Hit goblin', { damage: 10 });
  log.addEntry('damage-dealt', 'Follow-up strike', { amount: 5 });
  log.addEntry('damage-received', 'Took a hit', { damage: 8 });
  log.addEntry('heal', 'Potion used', { amount: 6 });
  const summary = log.getCombatSummary();

  assert.equal(summary.totalDamageDealt, 15);
  assert.equal(summary.totalDamageReceived, 8);
  assert.equal(summary.totalHealingDone, 6);
});

test('getCombatSummary tracks status effects uniquely', () => {
  const log = new BattleLog();
  log.startTurn(1);
  log.addEntry('status-applied', 'Poison applied', { status: 'Poison' });
  log.addEntry('status-applied', 'Burning applied', { name: 'Burning' });
  log.addEntry('status-applied', 'Poison refreshed', { status: 'Poison' });
  const summary = log.getCombatSummary();

  assert.deepEqual(summary.statusEffectsApplied, ['Poison', 'Burning']);
});

test('getCombatSummary tracks abilities used uniquely', () => {
  const log = new BattleLog();
  log.startTurn(1);
  log.addEntry('ability', 'Cast Fireball', { ability: 'Fireball' });
  log.addEntry('ability', 'Cast Frostbolt', { name: 'Frostbolt' });
  log.addEntry('ability', 'Cast Fireball again', { ability: 'Fireball' });
  const summary = log.getCombatSummary();

  assert.deepEqual(summary.abilitiesUsed, ['Fireball', 'Frostbolt']);
});

test('getCombatSummary tracks items used uniquely', () => {
  const log = new BattleLog();
  log.startTurn(1);
  log.addEntry('item-used', 'Used Bomb', { item: 'Bomb' });
  log.addEntry('item-used', 'Used Potion', { name: 'Potion' });
  log.addEntry('item-used', 'Used Bomb again', { item: 'Bomb' });
  const summary = log.getCombatSummary();

  assert.deepEqual(summary.itemsUsed, ['Bomb', 'Potion']);
});

test('getCombatSummary derives totalTurns from recorded turns', () => {
  const log = new BattleLog();
  log.startTurn(1);
  log.endTurn();
  log.startTurn(2);
  log.addEntry('attack', 'Strike for 4', { damage: 4 });
  const summary = log.getCombatSummary();

  assert.equal(summary.totalTurns, 2);
});

test('clear resets entries and turn counter', () => {
  const log = new BattleLog();
  log.startTurn(1);
  log.addEntry('victory', 'Enemy defeated');
  log.clear();

  assert.equal(log.entries.length, 0);
  assert.equal(log.currentTurn, 0);
});

test('invalid entry types throw an error', () => {
  const log = new BattleLog();
  assert.throws(() => log.addEntry('unknown-type', 'Oops'), /Invalid battle log entry type/);
});

test('singleton battleLog can be used directly', () => {
  battleLog.clear();
  battleLog.startTurn(1);
  battleLog.addEntry('damage-dealt', 'Heavy strike', { damage: 20 });
  const summary = battleLog.getCombatSummary();
  assert.equal(summary.totalDamageDealt, 20);
  battleLog.clear();
});

test('renderBattleLogPanel shows header and turn counter', () => {
  const log = new BattleLog();
  log.startTurn(5);
  log.addEntry('ability', 'Cast Flame Surge');
  const html = renderBattleLogPanel(log.entries, 5);

  assert.match(html, /Combat Log/);
  assert.match(html, /Turn 5/);
  assert.match(html, /🔥/);
});

test('renderBattleLogPanel limits visible entries based on maxVisible', () => {
  const log = new BattleLog();
  log.startTurn(1);
  for (let i = 0; i < 10; i++) {
    log.addEntry('attack', `Hit ${i}`);
  }
  const html = renderBattleLogPanel(log.entries, 3);
  const renderedEntries = (html.match(/battle-log-entry/g) || []).length;
  assert.equal(renderedEntries, 3);
});

test('renderBattleLogPanel escapes HTML in messages', () => {
  const log = new BattleLog();
  log.startTurn(1);
  log.addEntry('attack', '<script>alert(1)</script>');
  const html = renderBattleLogPanel(log.entries, 2);
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
});

test('getBattleLogStyles exposes panel styling', () => {
  const css = getBattleLogStyles();
  assert.match(css, /\.battle-log-panel/);
  assert.match(css, /max-height:\s*200px/);
});

test('getEntriesByTurn groups entries correctly', () => {
  const log = new BattleLog();
  log.startTurn(1);
  const entryOne = log.addEntry('attack', 'Strike');
  log.endTurn();
  log.startTurn(2);
  const entryTwo = log.addEntry('heal', 'Bandage');

  const grouped = log.getEntriesByTurn();

  assert.ok(grouped instanceof Map);
  assert.ok(grouped.has(1));
  assert.ok(grouped.has(2));
  assert.deepEqual(grouped.get(1).includes(entryOne), true);
  assert.deepEqual(grouped.get(2).includes(entryTwo), true);
});

test('filterEntries returns only specified types', () => {
  const log = new BattleLog();
  log.startTurn(1);
  log.addEntry('attack', 'Slash');
  log.addEntry('heal', 'Heal up');
  log.addEntry('ability', 'Power shot');

  const filtered = log.filterEntries(['attack', 'heal']);

  assert.equal(filtered.length, 2);
  assert.ok(filtered.every((entry) => ['attack', 'heal'].includes(entry.type)));
});

test('filterEntries with empty array returns all entries', () => {
  const log = new BattleLog();
  log.startTurn(1);
  log.addEntry('attack', 'Slash');
  log.addEntry('heal', 'Heal up');
  const filtered = log.filterEntries([]);
  assert.equal(filtered.length, log.entries.length);
});

test('renderBattleLogPanel with grouped option uses details elements', () => {
  const log = new BattleLog();
  log.startTurn(1);
  log.addEntry('attack', 'Slash');
  const html = renderBattleLogPanel(log.entries, { grouped: true });

  assert.match(html, /bl-turn-group/);
});

test('renderBattleLogPanel with showSummary=true shows damage summary when damage exists', () => {
  const log = new BattleLog();
  log.startTurn(1);
  log.addEntry('damage-dealt', 'Hit', { damage: 7 });
  const html = renderBattleLogPanel(log.entries, { showSummary: true });

  assert.match(html, /bl-damage-summary/);
});

test('renderBattleLogPanel entries have data-type attribute', () => {
  const log = new BattleLog();
  log.startTurn(1);
  log.addEntry('attack', 'Slash');
  const html = renderBattleLogPanel(log.entries, 5);

  assert.match(html, /data-type=/);
});

test('renderBattleLogPanel with activeFilters only shows matching types', () => {
  const log = new BattleLog();
  log.startTurn(1);
  log.addEntry('attack', 'Slash');
  log.addEntry('heal', 'Heal up');
  const html = renderBattleLogPanel(log.entries, { activeFilters: ['heal'] });
  const renderedEntries = (html.match(/battle-log-entry/g) || []).length;

  assert.equal(renderedEntries, 1);
});

test('renderFilterBar returns filter pills', () => {
  const html = renderFilterBar(['attack'], ['attack', 'heal']);

  assert.match(html, /bl-filter-btn/);
  assert.match(html, /bl-filter-active/);
  assert.match(html, /data-filter-type/);
});
