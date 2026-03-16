/**
 * Tests for Combat Stats Tracker — validates all tracking functions,
 * derived stats computation, and display formatting.
 */

import { strict as assert } from 'assert';
import {
  createCombatStats,
  recordPlayerAttack,
  recordPlayerDefend,
  recordAbilityUse,
  recordItemUse,
  recordPotionUse,
  recordDamageReceived,
  recordShieldDestroyed,
  recordEnemyBroken,
  recordBreakDamage,
  recordFleeAttempt,
  recordWeaknessHit,
  recordCompanionAction,
  recordStatusInflicted,
  recordStatusReceived,
  recordTurn,
  finalizeCombatStats,
  computeDerivedStats,
  formatCombatStatsDisplay,
} from '../src/combat-stats-tracker.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.error(`  ✗ ${name}: ${e.message}`);
  }
}

console.log('Combat Stats Tracker Tests');
console.log('==========================');

// --- createCombatStats ---
console.log('\n[createCombatStats]');
test('creates stats with enemy name', () => {
  const s = createCombatStats('Goblin');
  assert.equal(s.enemyName, 'Goblin');
  assert.equal(s.isBoss, false);
  assert.equal(s.turnsTotal, 0);
  assert.equal(s.totalDamageDealt, 0);
  assert.equal(s.totalDamageReceived, 0);
});

test('creates boss stats', () => {
  const s = createCombatStats('Dragon', true);
  assert.equal(s.isBoss, true);
  assert.equal(s.enemyName, 'Dragon');
});

test('defaults enemy name to Unknown', () => {
  const s = createCombatStats('');
  assert.equal(s.enemyName, 'Unknown');
});

test('initializes all counters to zero', () => {
  const s = createCombatStats('Slime');
  assert.equal(s.attackCount, 0);
  assert.equal(s.defendCount, 0);
  assert.equal(s.potionCount, 0);
  assert.equal(s.fleeAttempts, 0);
  assert.equal(s.weaknessHits, 0);
  assert.equal(s.shieldsDestroyed, 0);
  assert.equal(s.timesEnemyBroken, 0);
  assert.equal(s.breakDamageDealt, 0);
  assert.equal(s.companionDamageDealt, 0);
  assert.equal(s.maxSingleHit, 0);
  assert.equal(s.totalHealingDone, 0);
});

test('initializes empty arrays and objects', () => {
  const s = createCombatStats('Slime');
  assert.deepEqual(s.abilityUses, {});
  assert.deepEqual(s.itemUses, {});
  assert.deepEqual(s.statusEffectsInflicted, []);
  assert.deepEqual(s.statusEffectsReceived, []);
});

test('has startTime set', () => {
  const before = Date.now();
  const s = createCombatStats('Test');
  const after = Date.now();
  assert.ok(s.startTime >= before && s.startTime <= after);
  assert.equal(s.endTime, null);
});

// --- recordPlayerAttack ---
console.log('\n[recordPlayerAttack]');
test('records attack damage', () => {
  const s = createCombatStats('Goblin');
  recordPlayerAttack(s, 15);
  assert.equal(s.attackCount, 1);
  assert.equal(s.totalDamageDealt, 15);
  assert.equal(s.maxSingleHit, 15);
  assert.equal(s.maxSingleHitAbility, 'Basic Attack');
});

test('accumulates multiple attacks', () => {
  const s = createCombatStats('Goblin');
  recordPlayerAttack(s, 10);
  recordPlayerAttack(s, 20);
  assert.equal(s.attackCount, 2);
  assert.equal(s.totalDamageDealt, 30);
  assert.equal(s.maxSingleHit, 20);
});

test('handles zero damage', () => {
  const s = createCombatStats('Goblin');
  recordPlayerAttack(s, 0);
  assert.equal(s.attackCount, 1);
  assert.equal(s.totalDamageDealt, 0);
});

test('handles negative damage as zero', () => {
  const s = createCombatStats('Goblin');
  recordPlayerAttack(s, -5);
  assert.equal(s.totalDamageDealt, 0);
});

test('returns null stats unchanged', () => {
  assert.equal(recordPlayerAttack(null, 10), null);
});

// --- recordPlayerDefend ---
console.log('\n[recordPlayerDefend]');
test('increments defend count', () => {
  const s = createCombatStats('Slime');
  recordPlayerDefend(s);
  recordPlayerDefend(s);
  assert.equal(s.defendCount, 2);
});

test('returns null stats unchanged', () => {
  assert.equal(recordPlayerDefend(null), null);
});

// --- recordAbilityUse ---
console.log('\n[recordAbilityUse]');
test('records ability with damage', () => {
  const s = createCombatStats('Orc');
  recordAbilityUse(s, 'Fireball', 30);
  assert.equal(s.abilityUses['Fireball'], 1);
  assert.equal(s.totalDamageDealt, 30);
  assert.equal(s.maxSingleHit, 30);
  assert.equal(s.maxSingleHitAbility, 'Fireball');
});

test('records ability with healing', () => {
  const s = createCombatStats('Orc');
  recordAbilityUse(s, 'Heal', 0, 25);
  assert.equal(s.abilityUses['Heal'], 1);
  assert.equal(s.totalHealingDone, 25);
  assert.equal(s.totalDamageDealt, 0);
});

test('tracks multiple uses of same ability', () => {
  const s = createCombatStats('Orc');
  recordAbilityUse(s, 'Fireball', 30);
  recordAbilityUse(s, 'Fireball', 25);
  assert.equal(s.abilityUses['Fireball'], 2);
  assert.equal(s.totalDamageDealt, 55);
  assert.equal(s.maxSingleHit, 30);
});

test('tracks different abilities separately', () => {
  const s = createCombatStats('Orc');
  recordAbilityUse(s, 'Fireball', 30);
  recordAbilityUse(s, 'Blizzard', 35);
  assert.equal(s.abilityUses['Fireball'], 1);
  assert.equal(s.abilityUses['Blizzard'], 1);
  assert.equal(s.maxSingleHitAbility, 'Blizzard');
});

test('returns null stats unchanged', () => {
  assert.equal(recordAbilityUse(null, 'Test', 10), null);
});

// --- recordItemUse ---
console.log('\n[recordItemUse]');
test('records item use with healing', () => {
  const s = createCombatStats('Wolf');
  recordItemUse(s, 'Herb', 10);
  assert.equal(s.itemUses['Herb'], 1);
  assert.equal(s.totalHealingDone, 10);
});

test('records item use without healing', () => {
  const s = createCombatStats('Wolf');
  recordItemUse(s, 'Bomb', 0);
  assert.equal(s.itemUses['Bomb'], 1);
  assert.equal(s.totalHealingDone, 0);
});

// --- recordWeaknessHit ---
console.log('\n[recordWeaknessHit]');
test('increments weaknessHits', () => {
  const s = createCombatStats('Goblin');
  assert.equal(s.weaknessHits, 0);
  recordWeaknessHit(s);
  assert.equal(s.weaknessHits, 1);
  recordWeaknessHit(s);
  assert.equal(s.weaknessHits, 2);
});

test('handles null stats', () => {
  assert.equal(recordWeaknessHit(null), null);
});

// --- recordPotionUse ---
console.log('\n[recordPotionUse]');
test('records potion with healing', () => {
  const s = createCombatStats('Bat');
  recordPotionUse(s, 20);
  assert.equal(s.potionCount, 1);
  assert.equal(s.totalHealingDone, 20);
});

test('accumulates multiple potions', () => {
  const s = createCombatStats('Bat');
  recordPotionUse(s, 20);
  recordPotionUse(s, 15);
  assert.equal(s.potionCount, 2);
  assert.equal(s.totalHealingDone, 35);
});

// --- recordDamageReceived ---
console.log('\n[recordDamageReceived]');
test('records damage received', () => {
  const s = createCombatStats('Dragon');
  recordDamageReceived(s, 40);
  assert.equal(s.totalDamageReceived, 40);
});

test('accumulates damage received', () => {
  const s = createCombatStats('Dragon');
  recordDamageReceived(s, 40);
  recordDamageReceived(s, 30);
  assert.equal(s.totalDamageReceived, 70);
});

test('handles negative damage as zero', () => {
  const s = createCombatStats('Dragon');
  recordDamageReceived(s, -10);
  assert.equal(s.totalDamageReceived, 0);
});

// --- Shield/Break tracking ---
console.log('\n[Shield/Break Tracking]');
test('recordShieldDestroyed increments count', () => {
  const s = createCombatStats('Golem');
  recordShieldDestroyed(s);
  recordShieldDestroyed(s);
  assert.equal(s.shieldsDestroyed, 2);
});

test('recordEnemyBroken increments count', () => {
  const s = createCombatStats('Golem');
  recordEnemyBroken(s);
  assert.equal(s.timesEnemyBroken, 1);
});

test('recordBreakDamage accumulates', () => {
  const s = createCombatStats('Golem');
  recordBreakDamage(s, 50);
  recordBreakDamage(s, 30);
  assert.equal(s.breakDamageDealt, 80);
});

// --- recordFleeAttempt ---
console.log('\n[recordFleeAttempt]');
test('records flee attempt', () => {
  const s = createCombatStats('Dragon');
  recordFleeAttempt(s);
  assert.equal(s.fleeAttempts, 1);
});

// --- recordCompanionAction ---
console.log('\n[recordCompanionAction]');
test('records companion damage', () => {
  const s = createCombatStats('Orc');
  recordCompanionAction(s, 12, 0);
  assert.equal(s.companionAbilityUses, 1);
  assert.equal(s.companionDamageDealt, 12);
});

test('records companion healing', () => {
  const s = createCombatStats('Orc');
  recordCompanionAction(s, 0, 8);
  assert.equal(s.companionHealing, 8);
});

// --- Status Effects ---
console.log('\n[Status Effects]');
test('records status inflicted (no duplicates)', () => {
  const s = createCombatStats('Wraith');
  recordStatusInflicted(s, 'burn');
  recordStatusInflicted(s, 'burn');
  recordStatusInflicted(s, 'poison');
  assert.deepEqual(s.statusEffectsInflicted, ['burn', 'poison']);
});

test('records status received (no duplicates)', () => {
  const s = createCombatStats('Wraith');
  recordStatusReceived(s, 'slow');
  recordStatusReceived(s, 'slow');
  assert.deepEqual(s.statusEffectsReceived, ['slow']);
});

test('ignores empty effect name', () => {
  const s = createCombatStats('Test');
  recordStatusInflicted(s, '');
  assert.deepEqual(s.statusEffectsInflicted, []);
});

// --- recordTurn ---
console.log('\n[recordTurn]');
test('records player turn', () => {
  const s = createCombatStats('Slime');
  recordTurn(s, 'player');
  assert.equal(s.turnsTotal, 1);
  assert.equal(s.playerTurns, 1);
  assert.equal(s.enemyTurns, 0);
});

test('records enemy turn', () => {
  const s = createCombatStats('Slime');
  recordTurn(s, 'enemy');
  assert.equal(s.turnsTotal, 1);
  assert.equal(s.playerTurns, 0);
  assert.equal(s.enemyTurns, 1);
});

test('accumulates mixed turns', () => {
  const s = createCombatStats('Slime');
  recordTurn(s, 'player');
  recordTurn(s, 'enemy');
  recordTurn(s, 'player');
  assert.equal(s.turnsTotal, 3);
  assert.equal(s.playerTurns, 2);
  assert.equal(s.enemyTurns, 1);
});

// --- finalizeCombatStats ---
console.log('\n[finalizeCombatStats]');
test('sets outcome and final HP', () => {
  const s = createCombatStats('Slime');
  finalizeCombatStats(s, 'victory', 35, 50);
  assert.equal(s.outcome, 'victory');
  assert.equal(s.finalPlayerHp, 35);
  assert.equal(s.finalPlayerMaxHp, 50);
  assert.ok(s.endTime !== null);
});

test('handles defeat outcome', () => {
  const s = createCombatStats('Dragon');
  finalizeCombatStats(s, 'defeat', 0, 50);
  assert.equal(s.outcome, 'defeat');
  assert.equal(s.finalPlayerHp, 0);
});

test('handles fled outcome', () => {
  const s = createCombatStats('Dragon');
  finalizeCombatStats(s, 'fled', 10, 50);
  assert.equal(s.outcome, 'fled');
});

// --- computeDerivedStats ---
console.log('\n[computeDerivedStats]');
test('computes avg damage per turn', () => {
  const s = createCombatStats('Goblin');
  recordPlayerAttack(s, 10);
  recordPlayerAttack(s, 20);
  recordTurn(s, 'player');
  recordTurn(s, 'player');
  finalizeCombatStats(s, 'victory', 40, 50);
  const d = computeDerivedStats(s);
  assert.equal(d.avgDamagePerTurn, 15);
});

test('computes avg damage received per turn', () => {
  const s = createCombatStats('Goblin');
  recordDamageReceived(s, 8);
  recordDamageReceived(s, 12);
  recordTurn(s, 'enemy');
  recordTurn(s, 'enemy');
  finalizeCombatStats(s, 'victory', 30, 50);
  const d = computeDerivedStats(s);
  assert.equal(d.avgDamageReceivedPerTurn, 10);
});

test('computes HP remaining percent', () => {
  const s = createCombatStats('Slime');
  finalizeCombatStats(s, 'victory', 25, 50);
  const d = computeDerivedStats(s);
  assert.equal(d.hpRemainingPercent, 50);
});

test('computes net damage', () => {
  const s = createCombatStats('Orc');
  recordPlayerAttack(s, 100);
  recordDamageReceived(s, 30);
  finalizeCombatStats(s, 'victory', 20, 50);
  const d = computeDerivedStats(s);
  assert.equal(d.netDamage, 70);
});

test('identifies most used ability', () => {
  const s = createCombatStats('Boss');
  recordAbilityUse(s, 'Fireball', 20);
  recordAbilityUse(s, 'Fireball', 25);
  recordAbilityUse(s, 'Heal', 0, 15);
  finalizeCombatStats(s, 'victory', 30, 50);
  const d = computeDerivedStats(s);
  assert.equal(d.mostUsedAbility, 'Fireball');
});

test('identifies most used item', () => {
  const s = createCombatStats('Boss');
  recordItemUse(s, 'Bomb', 0);
  recordItemUse(s, 'Bomb', 0);
  recordItemUse(s, 'Herb', 10);
  finalizeCombatStats(s, 'victory', 30, 50);
  const d = computeDerivedStats(s);
  assert.equal(d.mostUsedItem, 'Bomb');
});

test('assigns S rating for flawless quick victory', () => {
  const s = createCombatStats('Slime');
  recordPlayerAttack(s, 50);
  recordTurn(s, 'player');
  finalizeCombatStats(s, 'victory', 50, 50);
  const d = computeDerivedStats(s);
  assert.equal(d.rating, 'S');
});

test('assigns D rating for fled', () => {
  const s = createCombatStats('Dragon');
  recordTurn(s, 'player');
  recordFleeAttempt(s);
  finalizeCombatStats(s, 'fled', 10, 50);
  const d = computeDerivedStats(s);
  assert.equal(d.rating, 'D');
});

test('assigns - rating for defeat', () => {
  const s = createCombatStats('Dragon');
  finalizeCombatStats(s, 'defeat', 0, 50);
  const d = computeDerivedStats(s);
  assert.equal(d.rating, '-');
});

test('handles null stats gracefully', () => {
  const d = computeDerivedStats(null);
  assert.deepEqual(d, {});
});

test('handles zero player turns (no division by zero)', () => {
  const s = createCombatStats('Test');
  finalizeCombatStats(s, 'victory', 50, 50);
  const d = computeDerivedStats(s);
  assert.equal(d.avgDamagePerTurn, 0);
});

// --- formatCombatStatsDisplay ---
console.log('\n[formatCombatStatsDisplay]');
test('returns sections array', () => {
  const s = createCombatStats('Goblin');
  recordPlayerAttack(s, 15);
  recordTurn(s, 'player');
  finalizeCombatStats(s, 'victory', 40, 50);
  const display = formatCombatStatsDisplay(s);
  assert.ok(Array.isArray(display.sections));
  assert.ok(display.sections.length >= 3);
});

test('header section has correct fields', () => {
  const s = createCombatStats('Dragon', true);
  finalizeCombatStats(s, 'victory', 5, 50);
  const display = formatCombatStatsDisplay(s);
  const header = display.sections.find(sec => sec.type === 'header');
  assert.ok(header);
  assert.equal(header.title, 'Boss Battle Complete!');
  assert.equal(header.subtitle, 'vs Dragon');
  assert.equal(header.outcome, 'victory');
});

test('non-boss header says Battle Complete', () => {
  const s = createCombatStats('Slime');
  finalizeCombatStats(s, 'victory', 40, 50);
  const display = formatCombatStatsDisplay(s);
  const header = display.sections.find(sec => sec.type === 'header');
  assert.equal(header.title, 'Battle Complete!');
});

test('includes shield break section when relevant', () => {
  const s = createCombatStats('Golem');
  recordShieldDestroyed(s);
  recordEnemyBroken(s);
  recordBreakDamage(s, 40);
  finalizeCombatStats(s, 'victory', 30, 50);
  const display = formatCombatStatsDisplay(s);
  const shieldSection = display.sections.find(sec => sec.title === 'Shield Break');
  assert.ok(shieldSection);
  assert.ok(shieldSection.rows.some(r => r.label === 'Shields Destroyed' && r.value === '1'));
});

test('excludes shield break section when no shields broken', () => {
  const s = createCombatStats('Slime');
  finalizeCombatStats(s, 'victory', 40, 50);
  const display = formatCombatStatsDisplay(s);
  const shieldSection = display.sections.find(sec => sec.title === 'Shield Break');
  assert.equal(shieldSection, undefined);
});

test('includes companion section when companion was active', () => {
  const s = createCombatStats('Orc');
  recordCompanionAction(s, 12, 5);
  finalizeCombatStats(s, 'victory', 30, 50);
  const display = formatCombatStatsDisplay(s);
  const compSection = display.sections.find(sec => sec.title === 'Companion');
  assert.ok(compSection);
});

test('excludes companion section when no companion actions', () => {
  const s = createCombatStats('Slime');
  finalizeCombatStats(s, 'victory', 40, 50);
  const display = formatCombatStatsDisplay(s);
  const compSection = display.sections.find(sec => sec.title === 'Companion');
  assert.equal(compSection, undefined);
});

test('includes status effects section when relevant', () => {
  const s = createCombatStats('Wraith');
  recordStatusInflicted(s, 'burn');
  recordStatusReceived(s, 'slow');
  finalizeCombatStats(s, 'victory', 30, 50);
  const display = formatCombatStatsDisplay(s);
  const effectsSection = display.sections.find(sec => sec.title === 'Status Effects');
  assert.ok(effectsSection);
  assert.ok(effectsSection.rows.some(r => r.label === 'Inflicted'));
  assert.ok(effectsSection.rows.some(r => r.label === 'Received'));
});

test('handles null stats gracefully', () => {
  const display = formatCombatStatsDisplay(null);
  assert.deepEqual(display, { sections: [] });
});

test('actions section includes flee attempts when > 0', () => {
  const s = createCombatStats('Dragon');
  recordFleeAttempt(s);
  finalizeCombatStats(s, 'fled', 10, 50);
  const display = formatCombatStatsDisplay(s);
  const actionsSection = display.sections.find(sec => sec.title === 'Actions');
  assert.ok(actionsSection);
  assert.ok(actionsSection.rows.some(r => r.label === 'Flee Attempts'));
});

// --- Integration: Full Combat Scenario ---
console.log('\n[Full Combat Scenario]');
test('complete combat flow produces valid stats', () => {
  const s = createCombatStats('Stone Golem', false);
  
  // Turn 1: Player attacks
  recordTurn(s, 'player');
  recordPlayerAttack(s, 12);
  recordShieldDestroyed(s);
  
  // Turn 1: Enemy attacks
  recordTurn(s, 'enemy');
  recordDamageReceived(s, 8);
  
  // Turn 2: Player uses ability
  recordTurn(s, 'player');
  recordAbilityUse(s, 'Power Strike', 25);
  recordShieldDestroyed(s);
  recordShieldDestroyed(s);
  recordEnemyBroken(s);
  
  // Turn 2: Enemy is broken, skips turn
  recordTurn(s, 'enemy');
  
  // Turn 3: Player attacks during break
  recordTurn(s, 'player');
  recordPlayerAttack(s, 30);
  recordBreakDamage(s, 30);
  
  // Turn 3: Enemy attacks
  recordTurn(s, 'enemy');
  recordDamageReceived(s, 10);
  
  // Turn 4: Player uses potion
  recordTurn(s, 'player');
  recordPotionUse(s, 15);
  
  // Turn 4: Enemy attacks
  recordTurn(s, 'enemy');
  recordDamageReceived(s, 7);
  
  // Turn 5: Player finishes
  recordTurn(s, 'player');
  recordAbilityUse(s, 'Power Strike', 28);
  
  // Companion helped
  recordCompanionAction(s, 10, 5);
  
  // Status effects
  recordStatusInflicted(s, 'stun');
  
  // Victory!
  finalizeCombatStats(s, 'victory', 40, 50);
  
  // Verify totals
  assert.equal(s.turnsTotal, 9);
  assert.equal(s.playerTurns, 5);
  assert.equal(s.enemyTurns, 4);
  assert.equal(s.totalDamageDealt, 95); // 12 + 25 + 30 + 28
  assert.equal(s.totalDamageReceived, 25); // 8 + 10 + 7
  assert.equal(s.totalHealingDone, 15);
  assert.equal(s.attackCount, 4); // 2 basic attacks + 2 offensive abilities
  assert.equal(s.abilityUses['Power Strike'], 2);
  assert.equal(s.potionCount, 1);
  assert.equal(s.shieldsDestroyed, 3);
  assert.equal(s.timesEnemyBroken, 1);
  assert.equal(s.breakDamageDealt, 30);
  assert.equal(s.maxSingleHit, 30);
  assert.equal(s.companionDamageDealt, 10);
  assert.equal(s.companionHealing, 5);
  assert.deepEqual(s.statusEffectsInflicted, ['stun']);
  assert.equal(s.outcome, 'victory');
  
  // Verify derived stats
  const d = computeDerivedStats(s);
  assert.equal(d.avgDamagePerTurn, 19); // 95/5 = 19
  assert.equal(d.avgDamageReceivedPerTurn, 6); // 25/4 = 6.25 -> 6
  assert.equal(d.netDamage, 70); // 95 - 25
  assert.equal(d.hpRemainingPercent, 80); // 40/50
  assert.equal(d.mostUsedAbility, 'Power Strike');
  assert.ok(['S', 'A', 'B'].includes(d.rating)); // Good performance
  
  // Verify display format
  const display = formatCombatStatsDisplay(s);
  assert.ok(display.sections.length >= 5); // header + overview + performance + actions + shield break + companion + status
  assert.ok(display.sections.some(sec => sec.title === 'Shield Break'));
  assert.ok(display.sections.some(sec => sec.title === 'Companion'));
  assert.ok(display.sections.some(sec => sec.title === 'Status Effects'));
});

// --- Summary ---
console.log(`\n==========================`);
console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
if (failed > 0) process.exit(1);
