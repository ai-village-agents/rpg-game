// Combat Item System Tests
// Tests for playerUseItem() in combat.js
// Created by Claude Opus 4.6 (Day 338)

import { strict as assert } from 'node:assert';
import { playerUseItem } from '../src/combat.js';
import { items } from '../src/data/items.js';

let passed = 0;
let failed = 0;
const errors = [];

function it(desc, fn) {
  try {
    fn();
    passed++;
  } catch (e) {
    failed++;
    errors.push({ desc, error: e.message });
  }
}

// Helper to create a base combat state
function makeState(overrides = {}) {
  return {
    phase: 'player-turn',
    turn: 1,
    rngSeed: 12345,
    log: [],
    player: {
      name: 'Hero',
      hp: 50,
      maxHp: 100,
      mp: 20,
      maxMp: 60,
      atk: 12,
      def: 8,
      spd: 10,
      defending: false,
      abilities: [],
      statusEffects: [],
      inventory: { potion: 3, hiPotion: 1, ether: 2, bomb: 2, antidote: 1 },
      ...(overrides.player || {}),
    },
    enemy: {
      name: 'Goblin',
      hp: 40,
      maxHp: 40,
      atk: 8,
      def: 4,
      spd: 6,
      defending: false,
      statusEffects: [],
      xpReward: 10,
      goldReward: 5,
      ...(overrides.enemy || {}),
    },
    ...(overrides.state || {}),
  };
}

// ==========================================
// 1. BASIC GUARD CLAUSES
// ==========================================

it('returns state unchanged if not player-turn phase', () => {
  const s = makeState({ state: { phase: 'enemy-turn' } });
  const result = playerUseItem(s, 'potion');
  assert.equal(result.phase, 'enemy-turn');
  assert.equal(result.player.hp, 50);
});

it('returns state unchanged if phase is exploration', () => {
  const s = makeState({ state: { phase: 'exploration' } });
  const result = playerUseItem(s, 'potion');
  assert.equal(result.phase, 'exploration');
});

it('returns state unchanged if phase is victory', () => {
  const s = makeState({ state: { phase: 'victory' } });
  const result = playerUseItem(s, 'potion');
  assert.equal(result.phase, 'victory');
});

it('returns state unchanged if phase is defeat', () => {
  const s = makeState({ state: { phase: 'defeat' } });
  const result = playerUseItem(s, 'potion');
  assert.equal(result.phase, 'defeat');
});

it('logs error for unknown item', () => {
  const s = makeState();
  const result = playerUseItem(s, 'nonexistent');
  assert.ok(result.log.some(l => l.includes('Unknown item')));
  assert.equal(result.phase, 'player-turn'); // stays on player turn
});

it('logs error for non-consumable item', () => {
  const s = makeState();
  s.player.inventory.rustySword = 1;
  const result = playerUseItem(s, 'rustySword');
  assert.ok(result.log.some(l => l.includes('cannot be used in combat')));
  assert.equal(result.phase, 'player-turn');
});

it('logs error when player has zero of item', () => {
  const s = makeState();
  s.player.inventory.potion = 0;
  const result = playerUseItem(s, 'potion');
  assert.ok(result.log.some(l => l.includes("don't have")));
  assert.equal(result.phase, 'player-turn');
});

it('logs error when item not in inventory at all', () => {
  const s = makeState();
  delete s.player.inventory.potion;
  const result = playerUseItem(s, 'potion');
  assert.ok(result.log.some(l => l.includes("don't have")));
});

// ==========================================
// 2. POTION (heal: 20)
// ==========================================

it('potion heals player by 20 HP', () => {
  const s = makeState();
  const result = playerUseItem(s, 'potion');
  assert.equal(result.player.hp, 70); // 50 + 20
});

it('potion does not exceed maxHp', () => {
  const s = makeState({ player: { hp: 90, maxHp: 100 } });
  const result = playerUseItem(s, 'potion');
  assert.equal(result.player.hp, 100); // capped
});

it('potion at full HP heals 0', () => {
  const s = makeState({ player: { hp: 100, maxHp: 100 } });
  const result = playerUseItem(s, 'potion');
  assert.equal(result.player.hp, 100);
  assert.ok(result.log.some(l => l.includes('restore 0 HP')));
});

it('potion decrements inventory count', () => {
  const s = makeState();
  const result = playerUseItem(s, 'potion');
  assert.equal(result.player.inventory.potion, 2); // 3 - 1
});

it('potion transitions to enemy-turn', () => {
  const s = makeState();
  const result = playerUseItem(s, 'potion');
  assert.equal(result.phase, 'enemy-turn');
});

it('potion clears defending flag', () => {
  const s = makeState({ player: { defending: true } });
  const result = playerUseItem(s, 'potion');
  assert.equal(result.player.defending, false);
});

it('potion logs usage message', () => {
  const s = makeState();
  const result = playerUseItem(s, 'potion');
  assert.ok(result.log.some(l => l.includes('Healing Potion') && l.includes('restore')));
});

it('using last potion removes it from inventory', () => {
  const s = makeState({ player: { inventory: { potion: 1 } } });
  const result = playerUseItem(s, 'potion');
  // removeItemFromInventory deletes keys at 0
  assert.ok(result.player.inventory.potion === undefined || result.player.inventory.potion === 0);
});

// ==========================================
// 3. HI-POTION (heal: 50)
// ==========================================

it('hiPotion heals player by 50 HP', () => {
  const s = makeState();
  const result = playerUseItem(s, 'hiPotion');
  assert.equal(result.player.hp, 100); // 50 + 50 = 100 (capped)
});

it('hiPotion heals correct amount when not capped', () => {
  const s = makeState({ player: { hp: 10, maxHp: 100 } });
  const result = playerUseItem(s, 'hiPotion');
  assert.equal(result.player.hp, 60); // 10 + 50
});

it('hiPotion decrements inventory', () => {
  const s = makeState();
  const result = playerUseItem(s, 'hiPotion');
  assert.ok(result.player.inventory.hiPotion === undefined || result.player.inventory.hiPotion === 0);
});

it('hiPotion transitions to enemy-turn', () => {
  const s = makeState();
  const result = playerUseItem(s, 'hiPotion');
  assert.equal(result.phase, 'enemy-turn');
});

it('hiPotion logs correct item name', () => {
  const s = makeState({ player: { hp: 10, maxHp: 100 } });
  const result = playerUseItem(s, 'hiPotion');
  assert.ok(result.log.some(l => l.includes('Hi-Potion') && l.includes('50 HP')));
});

// ==========================================
// 4. ETHER (mana: 40)
// ==========================================

it('ether restores 40 MP', () => {
  const s = makeState();
  const result = playerUseItem(s, 'ether');
  assert.equal(result.player.mp, 60); // 20 + 40 = 60 (= maxMp)
});

it('ether does not exceed maxMp', () => {
  const s = makeState({ player: { mp: 50, maxMp: 60 } });
  const result = playerUseItem(s, 'ether');
  assert.equal(result.player.mp, 60); // capped
});

it('ether at full MP restores 0', () => {
  const s = makeState({ player: { mp: 60, maxMp: 60 } });
  const result = playerUseItem(s, 'ether');
  assert.equal(result.player.mp, 60);
  assert.ok(result.log.some(l => l.includes('restore 0 MP')));
});

it('ether decrements inventory count', () => {
  const s = makeState();
  const result = playerUseItem(s, 'ether');
  assert.equal(result.player.inventory.ether, 1); // 2 - 1
});

it('ether transitions to enemy-turn', () => {
  const s = makeState();
  const result = playerUseItem(s, 'ether');
  assert.equal(result.phase, 'enemy-turn');
});

it('ether logs correct message', () => {
  const s = makeState();
  const result = playerUseItem(s, 'ether');
  assert.ok(result.log.some(l => l.includes('Ether') && l.includes('MP')));
});

it('ether with 0 maxMp restores 0', () => {
  const s = makeState({ player: { mp: 0, maxMp: 0 } });
  const result = playerUseItem(s, 'ether');
  assert.equal(result.player.mp, 0);
});

// ==========================================
// 5. BOMB (damage: 35 fire)
// ==========================================

it('bomb deals 35 fire damage to enemy', () => {
  const s = makeState();
  const result = playerUseItem(s, 'bomb');
  assert.equal(result.enemy.hp, 5); // 40 - 35
});

it('bomb can kill enemy (triggers victory)', () => {
  const s = makeState({ enemy: { hp: 30, maxHp: 40 } });
  const result = playerUseItem(s, 'bomb');
  assert.equal(result.enemy.hp, 0);
  assert.equal(result.phase, 'victory');
});

it('bomb decrements inventory count', () => {
  const s = makeState();
  const result = playerUseItem(s, 'bomb');
  assert.equal(result.player.inventory.bomb, 1); // 2 - 1
});

it('bomb transitions to enemy-turn if enemy survives', () => {
  const s = makeState();
  const result = playerUseItem(s, 'bomb');
  assert.equal(result.phase, 'enemy-turn');
});

it('bomb logs fire damage message', () => {
  const s = makeState();
  const result = playerUseItem(s, 'bomb');
  assert.ok(result.log.some(l => l.includes('Fire Bomb') && l.includes('35') && l.includes('fire')));
});

it('bomb does not heal the player', () => {
  const s = makeState();
  const result = playerUseItem(s, 'bomb');
  assert.equal(result.player.hp, 50); // unchanged
});

it('bomb victory awards XP and gold', () => {
  const s = makeState({ enemy: { hp: 10, maxHp: 40, xpReward: 25, goldReward: 15 } });
  const result = playerUseItem(s, 'bomb');
  assert.equal(result.phase, 'victory');
  assert.ok(result.log.some(l => l.includes('Victory')));
});

// ==========================================
// 6. ANTIDOTE (cleanse: ['poison'])
// ==========================================

it('antidote removes poison status effect', () => {
  const s = makeState({
    player: {
      statusEffects: [
        { type: 'poison', name: 'Poison', power: 3, duration: 3 },
      ],
    },
  });
  const result = playerUseItem(s, 'antidote');
  const poisonEffects = (result.player.statusEffects || []).filter(e => e.type === 'poison');
  assert.equal(poisonEffects.length, 0);
});

it('antidote does not remove non-poison status effects', () => {
  const s = makeState({
    player: {
      statusEffects: [
        { type: 'poison', name: 'Poison', power: 3, duration: 3 },
        { type: 'regen', name: 'Regen', power: 5, duration: 3 },
      ],
    },
  });
  const result = playerUseItem(s, 'antidote');
  // After processTurnStart runs, regen might tick but should still exist (duration decremented)
  // Actually since processTurnStart processes enemy, not player, regen should be untouched
  const regenEffects = (result.player.statusEffects || []).filter(e => e.type === 'regen');
  assert.ok(regenEffects.length > 0, 'Regen should remain');
});

it('antidote with no poison logs "nothing to cure"', () => {
  const s = makeState({ player: { statusEffects: [] } });
  const result = playerUseItem(s, 'antidote');
  assert.ok(result.log.some(l => l.includes('nothing to cure')));
});

it('antidote decrements inventory', () => {
  const s = makeState();
  const result = playerUseItem(s, 'antidote');
  assert.ok(result.player.inventory.antidote === undefined || result.player.inventory.antidote === 0);
});

it('antidote transitions to enemy-turn', () => {
  const s = makeState();
  const result = playerUseItem(s, 'antidote');
  assert.equal(result.phase, 'enemy-turn');
});

it('antidote logs cure message when poison removed', () => {
  const s = makeState({
    player: {
      statusEffects: [
        { type: 'poison', name: 'Poison', power: 3, duration: 3 },
      ],
    },
  });
  const result = playerUseItem(s, 'antidote');
  assert.ok(result.log.some(l => l.includes('Antidote') && l.includes('cure')));
});

// ==========================================
// 7. STUN INTERACTION
// ==========================================

it('stunned player cannot use items', () => {
  const s = makeState({
    player: {
      statusEffects: [{ type: 'stun', name: 'Stun', duration: 1 }],
    },
  });
  const result = playerUseItem(s, 'potion');
  assert.ok(result.log.some(l => l.includes('stunned')));
  assert.equal(result.player.hp, 50); // no heal
  // Should transition to enemy turn
  assert.ok(result.phase === 'enemy-turn' || result.phase === 'victory' || result.phase === 'defeat');
});

it('stunned player does not consume item', () => {
  const s = makeState({
    player: {
      statusEffects: [{ type: 'stun', name: 'Stun', duration: 1 }],
    },
  });
  const result = playerUseItem(s, 'potion');
  assert.equal(result.player.inventory.potion, 3); // unchanged
});

// ==========================================
// 8. EDGE CASES
// ==========================================

it('works with empty inventory object', () => {
  const s = makeState({ player: { inventory: {} } });
  const result = playerUseItem(s, 'potion');
  assert.ok(result.log.some(l => l.includes("don't have")));
});

it('works with undefined inventory', () => {
  const s = makeState();
  s.player.inventory = undefined;
  // hasItem handles undefined by returning false
  const result = playerUseItem(s, 'potion');
  assert.ok(result.log.some(l => l.includes("don't have")));
});

it('multiple items can be used in sequence', () => {
  const s = makeState();
  // Use a potion
  let result = playerUseItem(s, 'potion');
  assert.equal(result.player.hp, 70);
  assert.equal(result.player.inventory.potion, 2);

  // Reset to player-turn for next use
  result = { ...result, phase: 'player-turn' };
  result = playerUseItem(result, 'potion');
  assert.equal(result.player.hp, 90);
  assert.equal(result.player.inventory.potion, 1);
});

it('using bomb on enemy with exactly bomb damage kills it', () => {
  const s = makeState({ enemy: { hp: 35, maxHp: 40 } });
  const result = playerUseItem(s, 'bomb');
  assert.equal(result.enemy.hp, 0);
  assert.equal(result.phase, 'victory');
});

it('potion restores correct actual heal (partial)', () => {
  const s = makeState({ player: { hp: 85, maxHp: 100 } });
  const result = playerUseItem(s, 'potion');
  assert.equal(result.player.hp, 100);
  assert.ok(result.log.some(l => l.includes('restore 15 HP')));
});

it('ether restores correct actual MP (partial)', () => {
  const s = makeState({ player: { mp: 30, maxMp: 60 } });
  const result = playerUseItem(s, 'ether');
  assert.equal(result.player.mp, 60);
  assert.ok(result.log.some(l => l.includes('restore 30 MP')));
});

it('bomb does not modify player HP or MP', () => {
  const s = makeState();
  const result = playerUseItem(s, 'bomb');
  assert.equal(result.player.hp, 50);
  assert.equal(result.player.mp, 20);
});

it('antidote does not modify HP or MP', () => {
  const s = makeState();
  const result = playerUseItem(s, 'antidote');
  assert.equal(result.player.hp, 50);
  assert.equal(result.player.mp, 20);
});

it('all consumable items are recognized', () => {
  const consumables = Object.values(items).filter(i => i.type === 'consumable');
  assert.ok(consumables.length >= 5, 'Should have at least 5 consumable types');
  for (const c of consumables) {
    assert.ok(c.effect, `${c.id} should have effect field`);
  }
});

// ==========================================
// 9. ITEM DATA VALIDATION
// ==========================================

it('potion item data is correct', () => {
  assert.equal(items.potion.type, 'consumable');
  assert.equal(items.potion.effect.heal, 20);
});

it('hiPotion item data is correct', () => {
  assert.equal(items.hiPotion.type, 'consumable');
  assert.equal(items.hiPotion.effect.heal, 50);
});

it('ether item data is correct', () => {
  assert.equal(items.ether.type, 'consumable');
  assert.equal(items.ether.effect.mana, 40);
});

it('bomb item data is correct', () => {
  assert.equal(items.bomb.type, 'consumable');
  assert.equal(items.bomb.effect.damage, 35);
  assert.equal(items.bomb.effect.element, 'fire');
});

it('antidote item data is correct', () => {
  assert.equal(items.antidote.type, 'consumable');
  assert.deepEqual(items.antidote.effect.cleanse, ['poison']);
});

// ==========================================
// 10. INTEGRATION WITH EXISTING SYSTEMS
// ==========================================

it('playerUseItem is exported from combat.js', () => {
  assert.equal(typeof playerUseItem, 'function');
});

it('bomb on dying enemy still gives XP/gold via applyVictoryDefeat', () => {
  const s = makeState({
    player: { xp: 100, gold: 50 },
    enemy: { hp: 10, maxHp: 40, xpReward: 25, goldReward: 15 },
  });
  const result = playerUseItem(s, 'bomb');
  assert.equal(result.phase, 'victory');
  assert.equal(result.player.xp, 125); // 100 + 25
  assert.equal(result.player.gold, 65); // 50 + 15
});

it('antidote removes multiple poison effects if present', () => {
  const s = makeState({
    player: {
      statusEffects: [
        { type: 'poison', name: 'Poison', power: 3, duration: 3 },
        { type: 'poison', name: 'Strong Poison', power: 6, duration: 2 },
        { type: 'burn', name: 'Burn', power: 4, duration: 2 },
      ],
    },
  });
  const result = playerUseItem(s, 'antidote');
  const poisonEffects = (result.player.statusEffects || []).filter(e => e.type === 'poison');
  assert.equal(poisonEffects.length, 0, 'All poisons should be removed');
  // burn should remain
  const burnEffects = (result.player.statusEffects || []).filter(e => e.type === 'burn');
  assert.ok(burnEffects.length > 0, 'Burns should remain');
});

it('player inventory state is immutable (original not modified)', () => {
  const s = makeState();
  const originalPotionCount = s.player.inventory.potion;
  playerUseItem(s, 'potion');
  assert.equal(s.player.inventory.potion, originalPotionCount, 'Original state should not be mutated');
});

it('player HP state is immutable (original not modified)', () => {
  const s = makeState();
  const originalHp = s.player.hp;
  playerUseItem(s, 'potion');
  assert.equal(s.player.hp, originalHp, 'Original HP should not be mutated');
});

// ==========================================
// 11. ITEMS FIELD OF items.js INTEGRATION
// ==========================================

it('non-consumable items are rejected (weapon)', () => {
  const s = makeState();
  s.player.inventory.ironSword = 1;
  const result = playerUseItem(s, 'ironSword');
  assert.ok(result.log.some(l => l.includes('cannot be used in combat')));
  assert.equal(result.player.inventory.ironSword, 1); // not consumed
});

it('non-consumable items are rejected (armor)', () => {
  const s = makeState();
  s.player.inventory.chainmail = 1;
  const result = playerUseItem(s, 'chainmail');
  assert.ok(result.log.some(l => l.includes('cannot be used in combat')));
});

it('non-consumable items are rejected (accessory)', () => {
  const s = makeState();
  s.player.inventory.ringOfFortune = 1;
  const result = playerUseItem(s, 'ringOfFortune');
  assert.ok(result.log.some(l => l.includes('cannot be used in combat')));
});

// ==========================================
// 12. ENEMY STATUS EFFECTS ON TURN START
// ==========================================

it('enemy poison ticks when transitioning after item use', () => {
  const s = makeState({
    enemy: {
      hp: 40,
      maxHp: 40,
      statusEffects: [{ type: 'poison', name: 'Poison', power: 5, duration: 2 }],
    },
  });
  const result = playerUseItem(s, 'potion');
  // processTurnStart on enemy should tick poison
  assert.ok(result.enemy.hp < 40, 'Enemy should take poison damage during turn start');
});

// ==========================================
// SUMMARY
// ==========================================

console.log(`\n=== Combat Items Tests ===`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if (errors.length > 0) {
  console.log('\nFailures:');
  for (const e of errors) {
    console.log(`  FAIL: ${e.desc}`);
    console.log(`    ${e.error}`);
  }
}
console.log('');
if (failed > 0) process.exit(1);
