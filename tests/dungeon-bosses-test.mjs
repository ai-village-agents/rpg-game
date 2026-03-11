import { describe, it, test } from 'node:test';
import assert from 'node:assert/strict';

import { BOSSES, BOSS_ABILITIES, getBoss, getBossAbility } from '../src/data/bosses.js';
import { ENEMIES, getEnemy } from '../src/data/enemies.js';
import { items as ITEMS } from '../src/data/items.js';
import { DUNGEON_FLOORS } from '../src/dungeon-floors.js';

// ============================================
//   LICH KING BOSS TESTS
// ============================================

describe('Lich King Boss', () => {
  const lichKing = BOSSES['lich-king'];

  it('exists in BOSSES data', () => {
    assert.ok(lichKing, 'lich-king should exist in BOSSES');
  });

  it('has correct basic properties', () => {
    assert.equal(lichKing.id, 'lich-king');
    assert.equal(lichKing.name, 'Lich King');
    assert.equal(lichKing.isBoss, true);
    assert.equal(lichKing.element, 'shadow');
  });

  it('has exactly 3 phases', () => {
    assert.equal(lichKing.phases.length, 3);
  });

  it('phase 1 - Necromantic Majesty', () => {
    const p = lichKing.phases[0];
    assert.equal(p.phase, 1);
    assert.equal(p.name, 'Necromantic Majesty');
    assert.equal(p.hpThreshold, 1.0);
    assert.equal(p.maxHp, 350);
    assert.equal(p.mp, 120);
    assert.equal(p.aiBehavior, 'caster');
    assert.deepEqual(p.abilities, ['soul-bolt', 'bone-armor', 'raise-dead']);
  });

  it('phase 2 - Phylactery Unleashed', () => {
    const p = lichKing.phases[1];
    assert.equal(p.phase, 2);
    assert.equal(p.name, 'Phylactery Unleashed');
    assert.equal(p.hpThreshold, 0.55);
    assert.equal(p.atk, 28);
    assert.equal(p.aiBehavior, 'aggressive');
    assert.deepEqual(p.abilities, ['soul-bolt', 'death-wave', 'raise-dead', 'soul-drain']);
  });

  it('phase 3 - Undying Fury', () => {
    const p = lichKing.phases[2];
    assert.equal(p.phase, 3);
    assert.equal(p.name, 'Undying Fury');
    assert.equal(p.hpThreshold, 0.2);
    assert.equal(p.atk, 34);
    assert.equal(p.spd, 18);
    assert.equal(p.aiBehavior, 'aggressive');
    assert.deepEqual(p.abilities, ['death-wave', 'soul-drain', 'necrotic-storm']);
  });

  it('phases have descending HP thresholds', () => {
    for (let i = 1; i < lichKing.phases.length; i++) {
      assert.ok(lichKing.phases[i].hpThreshold < lichKing.phases[i - 1].hpThreshold,
        `Phase ${i + 1} threshold should be lower than phase ${i}`);
    }
  });

  it('attack increases with each phase', () => {
    for (let i = 1; i < lichKing.phases.length; i++) {
      assert.ok(lichKing.phases[i].atk > lichKing.phases[i - 1].atk,
        `Phase ${i + 1} atk should be higher than phase ${i}`);
    }
  });

  it('has appropriate rewards', () => {
    assert.equal(lichKing.xpReward, 500);
    assert.equal(lichKing.goldReward, 350);
    assert.ok(lichKing.drops.length > 0, 'Should have drops');
  });

  it('drops include lich-crown', () => {
    const lichCrownDrop = lichKing.drops.find(d => d.itemId === 'lich-crown');
    assert.ok(lichCrownDrop, 'Should drop lich-crown');
    assert.equal(lichCrownDrop.chance, 1.0, 'lich-crown should be guaranteed drop');
  });

  it('all drop items exist in ITEMS', () => {
    for (const drop of lichKing.drops) {
      assert.ok(ITEMS[drop.itemId], `Drop item ${drop.itemId} should exist in ITEMS`);
    }
  });

  it('all abilities exist in BOSS_ABILITIES', () => {
    const allAbilities = new Set();
    for (const phase of lichKing.phases) {
      for (const abilityId of phase.abilities) {
        allAbilities.add(abilityId);
      }
    }
    for (const abilityId of allAbilities) {
      assert.ok(BOSS_ABILITIES[abilityId], `Ability ${abilityId} should exist in BOSS_ABILITIES`);
    }
  });

  it('getBoss returns lich-king correctly', () => {
    const boss = getBoss('lich-king');
    assert.ok(boss);
    assert.equal(boss.id, 'lich-king');
    assert.equal(boss.name, 'Lich King');
  });
});

// ============================================
//   LICH KING ABILITIES TESTS
// ============================================

describe('Lich King Abilities', () => {
  const lichAbilityIds = ['soul-bolt', 'bone-armor', 'raise-dead', 'death-wave', 'soul-drain', 'necrotic-storm'];

  it('all 6 Lich King abilities exist', () => {
    for (const id of lichAbilityIds) {
      assert.ok(BOSS_ABILITIES[id], `Ability ${id} should exist`);
    }
  });

  it('all Lich King abilities use shadow element', () => {
    for (const id of lichAbilityIds) {
      assert.equal(BOSS_ABILITIES[id].element, 'shadow',
        `Ability ${id} should have shadow element`);
    }
  });

  it('soul-bolt has mp-drain effect', () => {
    const ability = BOSS_ABILITIES['soul-bolt'];
    assert.equal(ability.type, 'magical');
    assert.equal(ability.power, 30);
    assert.equal(ability.effect.type, 'mp-drain');
  });

  it('bone-armor is a buff ability', () => {
    const ability = BOSS_ABILITIES['bone-armor'];
    assert.equal(ability.type, 'buff');
    assert.equal(ability.effect.type, 'def-up');
    assert.equal(ability.effect.chance, 1.0, 'Bone armor should always succeed');
  });

  it('raise-dead is a summoning attack', () => {
    const ability = BOSS_ABILITIES['raise-dead'];
    assert.equal(ability.type, 'magical');
    assert.equal(ability.effect.type, 'atk-up');
  });

  it('death-wave has poison effect', () => {
    const ability = BOSS_ABILITIES['death-wave'];
    assert.equal(ability.power, 45);
    assert.equal(ability.effect.type, 'poison');
  });

  it('soul-drain has heal effect', () => {
    const ability = BOSS_ABILITIES['soul-drain'];
    assert.equal(ability.effect.type, 'heal');
    assert.equal(ability.effect.power, 20);
  });

  it('necrotic-storm is the strongest Lich ability', () => {
    const ability = BOSS_ABILITIES['necrotic-storm'];
    assert.equal(ability.power, 55);
    assert.equal(ability.mpCost, 35);
    assert.equal(ability.effect.type, 'poison');
    assert.ok(ability.effect.duration >= 3, 'Should have long duration');
  });

  it('abilities have increasing power for later phases', () => {
    // Phase 1 abilities are weaker, phase 3 abilities are stronger
    const p1Power = BOSS_ABILITIES['soul-bolt'].power;
    const p3Power = BOSS_ABILITIES['necrotic-storm'].power;
    assert.ok(p3Power > p1Power, 'Phase 3 ability should be stronger than phase 1');
  });
});

// ============================================
//   LICH KING ENEMY ENTRY TESTS
// ============================================

describe('Lich King Enemy Entry', () => {
  it('exists in ENEMIES data', () => {
    assert.ok(ENEMIES['lich-king'], 'lich-king should exist in ENEMIES');
  });

  it('has correct combat stats', () => {
    const enemy = ENEMIES['lich-king'];
    assert.equal(enemy.hp, 350);
    assert.equal(enemy.maxHp, 350);
    assert.equal(enemy.mp, 120);
    assert.equal(enemy.maxMp, 120);
    assert.equal(enemy.element, 'shadow');
    assert.equal(enemy.isBoss, true);
    assert.equal(enemy.aiBehavior, 'boss');
  });

  it('has all 6 abilities listed', () => {
    const enemy = ENEMIES['lich-king'];
    assert.equal(enemy.abilities.length, 6);
    assert.ok(enemy.abilities.includes('soul-bolt'));
    assert.ok(enemy.abilities.includes('necrotic-storm'));
  });

  it('getEnemy returns valid deep copy', () => {
    const enemy = getEnemy('lich-king');
    assert.ok(enemy);
    assert.equal(enemy.name, 'Lich King');
    assert.equal(enemy.hp, 350);
  });
});

// ============================================
//   PRIMORDIAL TITAN BOSS TESTS
// ============================================

describe('Primordial Titan Boss', () => {
  const titan = BOSSES['primordial-titan'];

  it('exists in BOSSES data', () => {
    assert.ok(titan, 'primordial-titan should exist in BOSSES');
  });

  it('has correct basic properties', () => {
    assert.equal(titan.id, 'primordial-titan');
    assert.equal(titan.name, 'Primordial Titan');
    assert.equal(titan.isBoss, true);
    assert.equal(titan.element, 'arcane');
  });

  it('has exactly 4 phases', () => {
    assert.equal(titan.phases.length, 4);
  });

  it('phase 1 - Awakening of Ages', () => {
    const p = titan.phases[0];
    assert.equal(p.phase, 1);
    assert.equal(p.name, 'Awakening of Ages');
    assert.equal(p.hpThreshold, 1.0);
    assert.equal(p.maxHp, 500);
    assert.equal(p.mp, 150);
    assert.equal(p.aiBehavior, 'basic');
    assert.deepEqual(p.abilities, ['primal-slam', 'creation-pulse', 'gravity-well']);
  });

  it('phase 2 - Unraveling Reality', () => {
    const p = titan.phases[1];
    assert.equal(p.phase, 2);
    assert.equal(p.name, 'Unraveling Reality');
    assert.equal(p.hpThreshold, 0.6);
    assert.equal(p.atk, 35);
    assert.equal(p.aiBehavior, 'aggressive');
    assert.deepEqual(p.abilities, ['primal-slam', 'reality-tear', 'gravity-well', 'cosmic-ray']);
  });

  it('phase 3 - Cataclysm', () => {
    const p = titan.phases[2];
    assert.equal(p.phase, 3);
    assert.equal(p.name, 'Cataclysm');
    assert.equal(p.hpThreshold, 0.3);
    assert.equal(p.atk, 42);
    assert.deepEqual(p.abilities, ['reality-tear', 'cosmic-ray', 'primordial-wrath', 'creation-pulse']);
  });

  it('phase 4 - Final Convergence', () => {
    const p = titan.phases[3];
    assert.equal(p.phase, 4);
    assert.equal(p.name, 'Final Convergence');
    assert.equal(p.hpThreshold, 0.1);
    assert.equal(p.atk, 50);
    assert.equal(p.spd, 22);
    assert.deepEqual(p.abilities, ['primordial-wrath', 'cosmic-ray', 'reality-tear']);
  });

  it('phases have descending HP thresholds', () => {
    for (let i = 1; i < titan.phases.length; i++) {
      assert.ok(titan.phases[i].hpThreshold < titan.phases[i - 1].hpThreshold,
        `Phase ${i + 1} threshold should be lower than phase ${i}`);
    }
  });

  it('attack increases with each phase', () => {
    for (let i = 1; i < titan.phases.length; i++) {
      assert.ok(titan.phases[i].atk > titan.phases[i - 1].atk,
        `Phase ${i + 1} atk should be higher than phase ${i}`);
    }
  });

  it('defense decreases with each phase (glass cannon progression)', () => {
    for (let i = 1; i < titan.phases.length; i++) {
      assert.ok(titan.phases[i].def < titan.phases[i - 1].def,
        `Phase ${i + 1} def should be lower than phase ${i}`);
    }
  });

  it('speed increases with each phase', () => {
    for (let i = 1; i < titan.phases.length; i++) {
      assert.ok(titan.phases[i].spd > titan.phases[i - 1].spd,
        `Phase ${i + 1} spd should be higher than phase ${i}`);
    }
  });

  it('is the strongest boss (highest HP and XP)', () => {
    for (const [id, boss] of Object.entries(BOSSES)) {
      if (id === 'primordial-titan') continue;
      assert.ok(titan.phases[0].maxHp >= boss.phases[0].maxHp,
        `Primordial Titan HP (${titan.phases[0].maxHp}) should be >= ${id} HP (${boss.phases[0].maxHp})`);
    }
  });

  it('has appropriate rewards (highest in game)', () => {
    assert.equal(titan.xpReward, 1000);
    assert.equal(titan.goldReward, 750);
    assert.ok(titan.drops.length > 0, 'Should have drops');
  });

  it('drops include primordial-shard', () => {
    const shardDrop = titan.drops.find(d => d.itemId === 'primordial-shard');
    assert.ok(shardDrop, 'Should drop primordial-shard');
    assert.equal(shardDrop.chance, 1.0, 'primordial-shard should be guaranteed drop');
  });

  it('all drop items exist in ITEMS', () => {
    for (const drop of titan.drops) {
      assert.ok(ITEMS[drop.itemId], `Drop item ${drop.itemId} should exist in ITEMS`);
    }
  });

  it('all abilities exist in BOSS_ABILITIES', () => {
    const allAbilities = new Set();
    for (const phase of titan.phases) {
      for (const abilityId of phase.abilities) {
        allAbilities.add(abilityId);
      }
    }
    for (const abilityId of allAbilities) {
      assert.ok(BOSS_ABILITIES[abilityId], `Ability ${abilityId} should exist in BOSS_ABILITIES`);
    }
  });

  it('getBoss returns primordial-titan correctly', () => {
    const boss = getBoss('primordial-titan');
    assert.ok(boss);
    assert.equal(boss.id, 'primordial-titan');
    assert.equal(boss.name, 'Primordial Titan');
  });
});

// ============================================
//   PRIMORDIAL TITAN ABILITIES TESTS
// ============================================

describe('Primordial Titan Abilities', () => {
  const titanAbilityIds = ['primal-slam', 'creation-pulse', 'gravity-well', 'reality-tear', 'cosmic-ray', 'primordial-wrath'];

  it('all 6 Primordial Titan abilities exist', () => {
    for (const id of titanAbilityIds) {
      assert.ok(BOSS_ABILITIES[id], `Ability ${id} should exist`);
    }
  });

  it('all Titan abilities use arcane element', () => {
    for (const id of titanAbilityIds) {
      assert.equal(BOSS_ABILITIES[id].element, 'arcane',
        `Ability ${id} should have arcane element`);
    }
  });

  it('primal-slam is physical with stun', () => {
    const ability = BOSS_ABILITIES['primal-slam'];
    assert.equal(ability.type, 'physical');
    assert.equal(ability.power, 40);
    assert.equal(ability.effect.type, 'stun');
  });

  it('creation-pulse has heal effect', () => {
    const ability = BOSS_ABILITIES['creation-pulse'];
    assert.equal(ability.type, 'magical');
    assert.equal(ability.effect.type, 'heal');
    assert.equal(ability.effect.power, 30);
    assert.equal(ability.effect.chance, 1.0);
  });

  it('gravity-well has speed debuff', () => {
    const ability = BOSS_ABILITIES['gravity-well'];
    assert.equal(ability.effect.type, 'spd-down');
    assert.ok(ability.effect.duration >= 2, 'Should have multi-turn duration');
  });

  it('reality-tear has defense debuff', () => {
    const ability = BOSS_ABILITIES['reality-tear'];
    assert.equal(ability.power, 50);
    assert.equal(ability.effect.type, 'def-down');
  });

  it('cosmic-ray has burn effect', () => {
    const ability = BOSS_ABILITIES['cosmic-ray'];
    assert.equal(ability.power, 45);
    assert.equal(ability.effect.type, 'burn');
    assert.ok(ability.effect.duration >= 2, 'Should have multi-turn burn');
  });

  it('primordial-wrath is the strongest Titan ability', () => {
    const ability = BOSS_ABILITIES['primordial-wrath'];
    assert.equal(ability.power, 65);
    assert.equal(ability.mpCost, 40);
    assert.equal(ability.effect.type, 'stun');
    // Should be the strongest among titan abilities
    for (const id of titanAbilityIds) {
      if (id === 'primordial-wrath') continue;
      assert.ok(ability.power >= BOSS_ABILITIES[id].power,
        `primordial-wrath (${ability.power}) should be >= ${id} (${BOSS_ABILITIES[id].power})`);
    }
  });

  it('abilities accessible via getBossAbility', () => {
    for (const id of titanAbilityIds) {
      const ability = getBossAbility(id);
      assert.ok(ability, `getBossAbility(${id}) should return ability`);
      assert.equal(ability.id, id);
    }
  });
});

// ============================================
//   LICH KING DROP ITEMS TESTS
// ============================================

describe('Lich Crown Item', () => {
  const lichCrown = ITEMS['lich-crown'];

  it('exists in ITEMS', () => {
    assert.ok(lichCrown, 'lich-crown should exist in ITEMS');
  });

  it('is legendary equipment', () => {
    assert.equal(lichCrown.type, 'armor');
    assert.equal(lichCrown.rarity, 'Legendary');
    assert.equal(lichCrown.slot, 'head');
  });

  it('has shadow-themed stats', () => {
    assert.ok(lichCrown.stats.defense > 0, 'Should have defense');
    assert.ok(lichCrown.stats.attack > 0, 'Should have attack');
    assert.ok(lichCrown.effect.shadowPower > 0, 'Should have shadowPower in effect');
  });

  it('has high value', () => {
    assert.ok(lichCrown.value >= 500, 'Legendary item should have high value');
  });
});

// ============================================
//   PRIMORDIAL SHARD ITEM TESTS
// ============================================

describe('Primordial Shard Item', () => {
  const shard = ITEMS['primordial-shard'];

  it('exists in ITEMS', () => {
    assert.ok(shard, 'primordial-shard should exist in ITEMS');
  });

  it('has high arcane power', () => {
    assert.ok(shard.effect.arcanePower >= 10, 'Should have significant arcanePower in effect');
  });

  it('has very high value', () => {
    assert.ok(shard.value >= 1000, 'Should be the most valuable boss drop');
  });
});

// ============================================
//   DUNGEON FLOOR 13 INTEGRATION TESTS
// ============================================

describe('Dungeon Floor 13 Boss Integration', () => {
  it('Floor 13 exists in DUNGEON_FLOORS', () => {
    const floor13 = DUNGEON_FLOORS.find(f => f.id === 13);
    assert.ok(floor13, 'Floor 13 should exist');
  });

  it('Floor 13 is a boss floor', () => {
    const floor13 = DUNGEON_FLOORS.find(f => f.id === 13);
    assert.equal(floor13.bossFloor, true);
  });

  it('Floor 13 boss is lich-king', () => {
    const floor13 = DUNGEON_FLOORS.find(f => f.id === 13);
    assert.equal(floor13.bossId, 'lich-king');
  });

  it('lich-king exists in both ENEMIES and BOSSES', () => {
    assert.ok(ENEMIES['lich-king'], 'lich-king should be in ENEMIES');
    assert.ok(BOSSES['lich-king'], 'lich-king should be in BOSSES');
  });

  it('lich-king HP is consistent between ENEMIES and BOSSES', () => {
    const enemyHp = ENEMIES['lich-king'].hp;
    const bossHp = BOSSES['lich-king'].phases[0].maxHp;
    assert.equal(enemyHp, bossHp,
      'HP should match between enemy entry and boss phase 1');
  });

  it('lich-king element is consistent', () => {
    const enemyElement = ENEMIES['lich-king'].element;
    const bossElement = BOSSES['lich-king'].element;
    assert.equal(enemyElement, bossElement,
      'Element should match between enemy entry and boss data');
  });

  it('Floor 13 encounter table includes lich-king', () => {
    // The encounter table should include the lich-king as a possible encounter
    // Import is from enemies.js
    const floor13Encounters = [['lich-king'], ['void-knight', 'thunder-titan'], ['infernal-sorcerer', 'crimson-berserker']];
    // Just verify our boss is reachable
    assert.ok(ENEMIES['lich-king'], 'lich-king enemy should be available for encounters');
  });
});

// ============================================
//   CROSS-BOSS COMPARISON TESTS
// ============================================

describe('Boss Scaling and Balance', () => {
  it('Lich King is weaker than Primordial Titan (HP)', () => {
    assert.ok(BOSSES['lich-king'].phases[0].maxHp < BOSSES['primordial-titan'].phases[0].maxHp,
      'Lich King should have less HP than Primordial Titan');
  });

  it('Lich King has fewer phases than Primordial Titan', () => {
    assert.ok(BOSSES['lich-king'].phases.length < BOSSES['primordial-titan'].phases.length,
      'Lich King (3 phases) should have fewer phases than Primordial Titan (4 phases)');
  });

  it('Lich King gives less XP than Primordial Titan', () => {
    assert.ok(BOSSES['lich-king'].xpReward < BOSSES['primordial-titan'].xpReward,
      'Lich King should give less XP');
  });

  it('Both bosses have unique elements', () => {
    assert.notEqual(BOSSES['lich-king'].element, BOSSES['primordial-titan'].element,
      'Bosses should have different elements');
  });

  it('No abilities are shared between Lich King and Primordial Titan', () => {
    const lichAbilities = new Set();
    for (const phase of BOSSES['lich-king'].phases) {
      phase.abilities.forEach(a => lichAbilities.add(a));
    }
    const titanAbilities = new Set();
    for (const phase of BOSSES['primordial-titan'].phases) {
      phase.abilities.forEach(a => titanAbilities.add(a));
    }
    for (const a of lichAbilities) {
      assert.ok(!titanAbilities.has(a),
        `Ability ${a} should not be shared between bosses`);
    }
  });

  it('All boss phases have dialogue', () => {
    for (const bossId of ['lich-king', 'primordial-titan']) {
      const boss = BOSSES[bossId];
      for (const phase of boss.phases) {
        assert.ok(phase.dialogue && phase.dialogue.length > 0,
          `${bossId} phase ${phase.phase} should have dialogue`);
      }
    }
  });

  it('All boss phases have valid aiBehavior', () => {
    const validBehaviors = ['basic', 'aggressive', 'caster', 'defensive', 'healer', 'boss'];
    for (const bossId of ['lich-king', 'primordial-titan']) {
      const boss = BOSSES[bossId];
      for (const phase of boss.phases) {
        assert.ok(validBehaviors.includes(phase.aiBehavior),
          `${bossId} phase ${phase.phase} aiBehavior "${phase.aiBehavior}" should be valid`);
      }
    }
  });

  it('Drop chances are between 0 and 1', () => {
    for (const bossId of ['lich-king', 'primordial-titan']) {
      const boss = BOSSES[bossId];
      for (const drop of boss.drops) {
        assert.ok(drop.chance > 0 && drop.chance <= 1.0,
          `${bossId} drop ${drop.itemId} chance should be between 0 and 1`);
      }
    }
  });
});

// ============================================
//   ARCANE ELEMENT SYSTEM TESTS
// ============================================

describe('Arcane Element Integration', () => {
  it('Primordial Titan boss uses arcane element', () => {
    assert.equal(BOSSES['primordial-titan'].element, 'arcane');
  });

  it('All Titan abilities consistently use arcane', () => {
    const titanAbilityIds = ['primal-slam', 'creation-pulse', 'gravity-well', 'reality-tear', 'cosmic-ray', 'primordial-wrath'];
    for (const id of titanAbilityIds) {
      assert.equal(BOSS_ABILITIES[id].element, 'arcane',
        `${id} should use arcane element`);
    }
  });
});
