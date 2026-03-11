/**
 * Tests for combat stats integration in battle-summary.js
 * Verifies that createBattleSummary includes combatStats and combatStatsDisplay,
 * and that renderCombatStatsHtml produces correct HTML output.
 */

import { createBattleSummary, formatBattleSummary, renderCombatStatsHtml } from '../src/battle-summary.js';
import { createCombatStats, recordPlayerAttack, recordPlayerDefend, recordAbilityUse,
         recordDamageReceived, recordTurn, finalizeCombatStats, formatCombatStatsDisplay } from '../src/combat-stats-tracker.js';

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('FAIL:', msg); }
}

// ── createBattleSummary tests ──

// Test 1: createBattleSummary without combatStats returns null fields
{
  const state = {
    xpGained: 50,
    goldGained: 25,
    enemy: { name: 'Slime' },
    lootedItems: [],
    pendingLevelUps: [],
  };
  const summary = createBattleSummary(state);
  assert(summary.combatStats === null, 'combatStats should be null when not present in state');
  assert(summary.combatStatsDisplay === null, 'combatStatsDisplay should be null when not present');
  assert(summary.xpGained === 50, 'xpGained should be preserved');
  assert(summary.goldGained === 25, 'goldGained should be preserved');
  assert(summary.enemyName === 'Slime', 'enemyName should be preserved');
}

// Test 2: createBattleSummary with combatStats includes display data
{
  let stats = createCombatStats('Goblin', false);
  stats = recordPlayerAttack(stats, 15);
  stats = recordTurn(stats, 'player');
  stats = recordDamageReceived(stats, 5);
  stats = recordTurn(stats, 'enemy');
  stats = finalizeCombatStats(stats, 'victory', 45, 50);
  
  const state = {
    xpGained: 30,
    goldGained: 10,
    enemy: { name: 'Goblin' },
    lootedItems: [{ name: 'Goblin Tooth', rarity: 'Common' }],
    pendingLevelUps: [],
    combatStats: stats,
  };
  const summary = createBattleSummary(state);
  assert(summary.combatStats !== null, 'combatStats should be present');
  assert(summary.combatStats.enemyName === 'Goblin', 'combatStats.enemyName should be Goblin');
  assert(summary.combatStats.totalDamageDealt === 15, 'combatStats damage dealt should be 15');
  assert(summary.combatStats.totalDamageReceived === 5, 'combatStats damage received should be 5');
  assert(summary.combatStatsDisplay !== null, 'combatStatsDisplay should be present');
  assert(Array.isArray(summary.combatStatsDisplay.sections), 'combatStatsDisplay should have sections array');
  assert(summary.combatStatsDisplay.sections.length > 0, 'combatStatsDisplay should have at least one section');
}

// Test 3: createBattleSummary preserves existing fields alongside combatStats
{
  let stats = createCombatStats('Dragon', true);
  stats = finalizeCombatStats(stats, 'victory', 10, 100);
  
  const state = {
    xpGained: 500,
    goldGained: 200,
    enemy: { name: 'Dragon' },
    lootedItems: [{ name: 'Dragon Scale', rarity: 'Legendary' }],
    pendingLevelUps: [{ memberName: 'Hero', newLevel: 10 }],
    combatStats: stats,
  };
  const summary = createBattleSummary(state);
  assert(summary.xpGained === 500, 'xpGained preserved with combatStats');
  assert(summary.goldGained === 200, 'goldGained preserved with combatStats');
  assert(summary.enemyName === 'Dragon', 'enemyName preserved with combatStats');
  assert(summary.lootedItems.length === 1, 'lootedItems preserved');
  assert(summary.levelUps.length === 1, 'levelUps preserved');
  assert(summary.combatStats.isBoss === true, 'isBoss flag preserved');
}

// ── renderCombatStatsHtml tests ──

// Test 4: renderCombatStatsHtml with null returns empty string
{
  assert(renderCombatStatsHtml(null) === '', 'null input returns empty string');
  assert(renderCombatStatsHtml(undefined) === '', 'undefined input returns empty string');
  assert(renderCombatStatsHtml({}) === '', 'empty object returns empty string');
  assert(renderCombatStatsHtml({ sections: [] }) === '', 'empty sections returns empty string');
}

// Test 5: renderCombatStatsHtml with header section renders rating
{
  const display = {
    sections: [
      { type: 'header', title: 'Battle Complete!', subtitle: 'vs Slime', rating: 'S', outcome: 'victory' }
    ]
  };
  const html = renderCombatStatsHtml(display);
  assert(html.includes('combat-stats-panel'), 'contains panel class');
  assert(html.includes('S'), 'contains S rating');
  assert(html.includes('#d4af37'), 'S rating uses gold color');
  assert(html.includes('Battle Complete!'), 'contains title');
  assert(html.includes('vs Slime'), 'contains subtitle');
}

// Test 6: renderCombatStatsHtml with stats section renders rows
{
  const display = {
    sections: [
      {
        type: 'stats',
        title: 'Combat Overview',
        rows: [
          { label: 'Turns', value: '5' },
          { label: 'Damage Dealt', value: '120', style: 'good' },
          { label: 'Damage Received', value: '30', style: 'bad' },
        ]
      }
    ]
  };
  const html = renderCombatStatsHtml(display);
  assert(html.includes('Combat Overview'), 'contains section title');
  assert(html.includes('Turns'), 'contains Turns label');
  assert(html.includes('120'), 'contains damage dealt value');
  assert(html.includes('color:#4f4'), 'good style has green color');
  assert(html.includes('color:#f44'), 'bad style has red color');
}

// Test 7: renderCombatStatsHtml with A rating uses green color
{
  const display = {
    sections: [
      { type: 'header', rating: 'A', title: 'Test', subtitle: 'test' }
    ]
  };
  const html = renderCombatStatsHtml(display);
  assert(html.includes('#4f4'), 'A rating uses green');
}

// Test 8: renderCombatStatsHtml with B rating uses blue color
{
  const display = {
    sections: [
      { type: 'header', rating: 'B', title: 'Test', subtitle: 'test' }
    ]
  };
  const html = renderCombatStatsHtml(display);
  assert(html.includes('#4af'), 'B rating uses blue');
}

// Test 9: renderCombatStatsHtml with D rating uses red color
{
  const display = {
    sections: [
      { type: 'header', rating: 'D', title: 'Test', subtitle: 'test' }
    ]
  };
  const html = renderCombatStatsHtml(display);
  assert(html.includes('#f44'), 'D rating uses red');
}

// Test 10: renderCombatStatsHtml escapes HTML in user strings
{
  const display = {
    sections: [
      { type: 'header', title: '<script>alert("xss")</script>', subtitle: 'test', rating: 'C' },
      { type: 'stats', title: 'Test', rows: [{ label: '<b>bold</b>', value: '&dangerous' }] }
    ]
  };
  const html = renderCombatStatsHtml(display);
  assert(!html.includes('<script>'), 'HTML in title is escaped');
  assert(html.includes('&lt;script&gt;'), 'script tag properly escaped');
  assert(html.includes('&amp;dangerous'), 'ampersand properly escaped');
}

// Test 11: Full integration - create stats, build summary, render HTML
{
  let stats = createCombatStats('Orc', false);
  stats = recordPlayerAttack(stats, 20);
  stats = recordTurn(stats, 'player');
  stats = recordPlayerAttack(stats, 25);
  stats = recordTurn(stats, 'player');
  stats = recordDamageReceived(stats, 10);
  stats = recordTurn(stats, 'enemy');
  stats = recordPlayerDefend(stats);
  stats = recordTurn(stats, 'player');
  stats = recordAbilityUse(stats, 'fireball', 35, 0);
  stats = recordTurn(stats, 'player');
  stats = finalizeCombatStats(stats, 'victory', 40, 50);
  
  const state = {
    xpGained: 100,
    goldGained: 50,
    enemy: { name: 'Orc' },
    lootedItems: [],
    pendingLevelUps: [],
    combatStats: stats,
  };
  const summary = createBattleSummary(state);
  const html = renderCombatStatsHtml(summary.combatStatsDisplay);
  
  assert(html.length > 0, 'full integration produces non-empty HTML');
  assert(html.includes('combat-stats-panel'), 'full integration has panel');
  assert(html.includes('Orc'), 'full integration shows enemy name');
  assert(html.includes('Combat Overview'), 'full integration shows combat overview');
  assert(html.includes('Performance'), 'full integration shows performance section');
  assert(html.includes('Actions'), 'full integration shows actions section');
}

// Test 12: Stats section with no style attribute renders without color
{
  const display = {
    sections: [
      { type: 'stats', title: 'Test', rows: [{ label: 'HP', value: '50' }] }
    ]
  };
  const html = renderCombatStatsHtml(display);
  assert(!html.includes('color:#4f4') || html.includes('color:#4f4') === false, 'no style means no green');
  // More precise: check the value div doesn't have a color style
  assert(html.includes('HP'), 'label is rendered');
  assert(html.includes('50'), 'value is rendered');
}

// Test 13: renderCombatStatsHtml with unknown section type renders empty
{
  const display = {
    sections: [
      { type: 'unknown', data: 'test' }
    ]
  };
  const html = renderCombatStatsHtml(display);
  assert(html.includes('combat-stats-panel'), 'panel still rendered');
  assert(!html.includes('test'), 'unknown section type content not rendered');
}

// Test 14: Boss battle shows different title
{
  let stats = createCombatStats('Forest Guardian', true);
  stats = finalizeCombatStats(stats, 'victory', 30, 100);
  const display = formatCombatStatsDisplay(stats);
  const html = renderCombatStatsHtml(display);
  assert(html.includes('Boss Battle Complete!'), 'boss battle title shown');
}

// Test 15: Defeat outcome doesn't show victory rating
{
  let stats = createCombatStats('Dragon', false);
  stats = recordDamageReceived(stats, 100);
  stats = recordTurn(stats, 'enemy');
  stats = finalizeCombatStats(stats, 'defeat', 0, 50);
  const display = formatCombatStatsDisplay(stats);
  assert(display.sections[0].outcome === 'defeat', 'outcome is defeat');
  assert(display.sections[0].rating === '-', 'defeat rating is dash');
}

// Test 16: Fled outcome gets D rating
{
  let stats = createCombatStats('Dragon', false);
  stats = recordTurn(stats, 'player');
  stats = finalizeCombatStats(stats, 'fled', 20, 50);
  const display = formatCombatStatsDisplay(stats);
  assert(display.sections[0].rating === 'D', 'fled gets D rating');
}

// Test 17: renderCombatStatsHtml with C rating uses gray color
{
  const display = {
    sections: [
      { type: 'header', rating: 'C', title: 'Test', subtitle: 'test' }
    ]
  };
  const html = renderCombatStatsHtml(display);
  assert(html.includes('#999'), 'C rating uses gray');
}

// Test 18: Multiple sections all render
{
  const display = {
    sections: [
      { type: 'header', rating: 'A', title: 'Battle Complete!', subtitle: 'vs Slime' },
      { type: 'stats', title: 'Overview', rows: [{ label: 'Turns', value: '3' }] },
      { type: 'stats', title: 'Actions', rows: [{ label: 'Attacks', value: '2' }] },
    ]
  };
  const html = renderCombatStatsHtml(display);
  assert(html.includes('Battle Complete!'), 'header rendered');
  assert(html.includes('Overview'), 'first stats section rendered');
  assert(html.includes('Actions'), 'second stats section rendered');
}

// Test 19: formatBattleSummary still works (backward compatibility)
{
  const summary = {
    xpGained: 50,
    goldGained: 25,
    enemyName: 'Slime',
    lootedItems: [{ name: 'Slime Gel' }],
    levelUps: [],
  };
  const formatted = formatBattleSummary(summary);
  assert(formatted.title === 'Battle Won!', 'formatBattleSummary still works');
  assert(formatted.xpLine === 'XP Gained: +50', 'xp line correct');
  assert(formatted.hasLoot === true, 'hasLoot correct');
}

// Test 20: Empty enemy name defaults
{
  const state = {
    enemy: null,
    combatStats: null,
  };
  const summary = createBattleSummary(state);
  assert(summary.enemyName === 'Unknown Enemy', 'null enemy defaults to Unknown Enemy');
  assert(summary.combatStats === null, 'null combatStats preserved');
}

// Test 21: Shield break section appears when shields destroyed
{
  let stats = createCombatStats('Stone Golem', false);
  stats.shieldsDestroyed = 3;
  stats.timesEnemyBroken = 1;
  stats.breakDamageDealt = 50;
  stats = finalizeCombatStats(stats, 'victory', 40, 50);
  const display = formatCombatStatsDisplay(stats);
  const html = renderCombatStatsHtml(display);
  assert(html.includes('Shield Break'), 'shield break section shown');
  assert(html.includes('Shields Destroyed'), 'shields destroyed row shown');
}

// Test 22: Companion section appears when companion was active
{
  let stats = createCombatStats('Wolf', false);
  stats.companionAbilityUses = 3;
  stats.companionDamageDealt = 25;
  stats.companionHealing = 10;
  stats = finalizeCombatStats(stats, 'victory', 45, 50);
  const display = formatCombatStatsDisplay(stats);
  const html = renderCombatStatsHtml(display);
  assert(html.includes('Companion'), 'companion section shown');
}

// Test 23: Status effects section appears when effects present
{
  let stats = createCombatStats('Cultist', false);
  stats.statusEffectsInflicted = ['Burn', 'Poison'];
  stats.statusEffectsReceived = ['Curse'];
  stats = finalizeCombatStats(stats, 'victory', 30, 50);
  const display = formatCombatStatsDisplay(stats);
  const html = renderCombatStatsHtml(display);
  assert(html.includes('Status Effects'), 'status effects section shown');
  assert(html.includes('Burn'), 'inflicted effects shown');
}

// Test 24: Rating colors are inline styles (not class-based)
{
  const display = {
    sections: [
      { type: 'header', rating: 'S', title: 'Test', subtitle: 'test' }
    ]
  };
  const html = renderCombatStatsHtml(display);
  assert(html.includes('style=') && html.includes('#d4af37'), 'rating color is inline style');
}

// Test 25: Panel has proper border and background styling
{
  const display = {
    sections: [
      { type: 'header', rating: 'A', title: 'Test', subtitle: 'test' }
    ]
  };
  const html = renderCombatStatsHtml(display);
  assert(html.includes('border:1px solid'), 'panel has border');
  assert(html.includes('border-radius:8px'), 'panel has rounded corners');
  assert(html.includes('background:rgba(0,0,0,0.25)'), 'panel has dark background');
}

// Test 26: Row layout uses flexbox for label-value alignment
{
  const display = {
    sections: [
      { type: 'stats', title: 'Test', rows: [{ label: 'HP', value: '50' }] }
    ]
  };
  const html = renderCombatStatsHtml(display);
  assert(html.includes('display:flex'), 'rows use flexbox');
  assert(html.includes('justify-content:space-between'), 'rows space between');
}

// Test 27: createBattleSummary with undefined combatStats
{
  const state = { xpGained: 10, goldGained: 5, enemy: { name: 'Bat' } };
  // No combatStats property at all
  const summary = createBattleSummary(state);
  assert(summary.combatStats === null, 'missing combatStats defaults to null');
  assert(summary.combatStatsDisplay === null, 'missing combatStats means null display');
}

// Test 28: Large damage numbers render correctly
{
  const display = {
    sections: [
      { type: 'stats', title: 'Test', rows: [{ label: 'Damage', value: '99999', style: 'good' }] }
    ]
  };
  const html = renderCombatStatsHtml(display);
  assert(html.includes('99999'), 'large numbers render');
}

// Test 29: Header with missing rating still renders
{
  const display = {
    sections: [
      { type: 'header', title: 'Test', subtitle: 'test' }
    ]
  };
  const html = renderCombatStatsHtml(display);
  assert(html.includes('Test'), 'header without rating still renders title');
  assert(html.includes('#999'), 'missing rating defaults to gray');
}

// Test 30: Stats rows with missing style render without color override
{
  const display = {
    sections: [
      { type: 'stats', title: 'Test', rows: [{ label: 'Test', value: '42' }] }
    ]
  };
  const html = renderCombatStatsHtml(display);
  assert(html.includes('42'), 'value renders without style');
}

console.log(`\n=== Battle Summary Combat Stats Tests ===`);
console.log(`Passed: ${passed}/${passed + failed}`);
if (failed > 0) {
  console.log(`Failed: ${failed}`);
  process.exit(1);
} else {
  console.log('All tests passed! ✅');
}
