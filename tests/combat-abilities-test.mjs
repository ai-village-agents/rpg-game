/**
 * Combat Abilities Tests - AI Village RPG
 * Tests for playerUseAbility() in src/combat.js + related state/render wiring
 * Run: node tests/combat-abilities-test.mjs
 */

import {
  playerUseAbility,
  addStatusEffect,
  startNewEncounter,
} from '../src/combat.js';
import { getAbility, getAbilityDisplayInfo } from '../src/combat/abilities.js';
import { initialStateWithClass } from '../src/state.js';

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

// Helper: create a combat state for a given class in player-turn phase
function makeCombatState(classId, overrides = {}) {
  const base = initialStateWithClass(classId);
  // Force into combat
  const state = {
    ...base,
    phase: 'player-turn',
    turn: 1,
    player: {
      ...base.player,
      hp: base.player.maxHp,
      mp: base.player.maxMp ?? 20,
      defending: false,
      statusEffects: [],
      inventory: { potion: 3 },
      ...(overrides.player ?? {}),
    },
    enemy: {
      id: 'slime',
      name: 'Slime',
      hp: 30,
      maxHp: 30,
      atk: 5,
      def: 2,
      defending: false,
      statusEffects: [],
      xpReward: 10,
      goldReward: 5,
      ...(overrides.enemy ?? {}),
    },
    log: overrides.log ?? [],
    rngSeed: overrides.rngSeed ?? 42,
  };
  return state;
}

// ══════════════════════════════════════════════════════════════════════
// SECTION 1: playerUseAbility — damage abilities
// ══════════════════════════════════════════════════════════════════════
console.log('\n--- playerUseAbility: damage abilities ---');

{
  // Warrior: power-strike (1.5x physical, 4 MP, single-enemy)
  const state = makeCombatState('warrior');
  const result = playerUseAbility(state, 'power-strike');
  assert(result.player.mp === state.player.mp - 4, 'power-strike deducts 4 MP');
  assert(result.enemy.hp < state.enemy.hp, 'power-strike damages enemy');
  assert(result.phase === 'enemy-turn', 'power-strike transitions to enemy-turn');
  assert(result.log.some(l => l.includes('Power Strike')), 'power-strike logs ability use');
  assert(result.log.some(l => l.includes('physical damage')), 'power-strike logs damage with element');
}

{
  // Mage: fireball (1.8x fire, 6 MP, single-enemy)
  const state = makeCombatState('mage');
  const result = playerUseAbility(state, 'fireball');
  assert(result.player.mp === state.player.mp - 6, 'fireball deducts 6 MP');
  assert(result.enemy.hp < state.enemy.hp, 'fireball damages enemy');
  assert(result.log.some(l => l.includes('fire damage')), 'fireball logs fire damage');
}

{
  // Rogue: backstab (2.0x physical, 5 MP, single-enemy)
  const state = makeCombatState('rogue');
  const result = playerUseAbility(state, 'backstab');
  assert(result.player.mp === state.player.mp - 5, 'backstab deducts 5 MP');
  assert(result.enemy.hp < state.enemy.hp, 'backstab damages enemy');
}

{
  // Cleric: smite (1.5x light, 6 MP, single-enemy)
  const state = makeCombatState('cleric');
  const result = playerUseAbility(state, 'smite');
  assert(result.player.mp === state.player.mp - 6, 'smite deducts 6 MP');
  assert(result.enemy.hp < state.enemy.hp, 'smite damages enemy');
  assert(result.log.some(l => l.includes('light damage')), 'smite logs light damage');
}

// ══════════════════════════════════════════════════════════════════════
// SECTION 2: playerUseAbility — damage calculation correctness
// ══════════════════════════════════════════════════════════════════════
console.log('\n--- playerUseAbility: damage calculation ---');

{
  // Verify damage formula: max(1, floor(atk * power) - def)
  const state = makeCombatState('warrior', {
    player: { atk: 10, mp: 20, maxMp: 20 },
    enemy: { def: 3 },
  });
  const result = playerUseAbility(state, 'power-strike');
  // power-strike: power=1.5, atk=10 → floor(10*1.5)=15, -3 def = 12
  const damageDealt = state.enemy.hp - result.enemy.hp;
  assert(damageDealt >= 10 && damageDealt <= 14,
    `power-strike damage with variance should be between 10 and 14 (got ${damageDealt}), enemy hp went from ${state.enemy.hp} to ${result.enemy.hp}`);
}

{
  // Verify minimum damage of 1 when defense > raw damage
  const state = makeCombatState('warrior', {
    player: { atk: 1, mp: 20, maxMp: 20 },
    enemy: { def: 100 },
  });
  const result = playerUseAbility(state, 'power-strike');
  // floor(1*1.5)=1, -100 def = -99 → clamped to 1
  assert(result.enemy.hp === state.enemy.hp - 1,
    'damage is minimum 1 even when def > raw damage');
}

// ══════════════════════════════════════════════════════════════════════
// SECTION 3: playerUseAbility — healing abilities
// ══════════════════════════════════════════════════════════════════════
console.log('\n--- playerUseAbility: healing abilities ---');

{
  // Cleric: heal (15 HP, 5 MP, single-ally)
  const state = makeCombatState('cleric', {
    player: { hp: 40, maxHp: 100, mp: 20, maxMp: 20 },
  });
  const result = playerUseAbility(state, 'heal');
  assert(result.player.mp === 20 - 5, 'heal deducts 5 MP');
  assert(result.player.hp === 55, 'heal restores 15 HP (40 → 55)');
  assert(result.log.some(l => l.includes('healed for 15 HP')), 'heal logs healing amount');
}

{
  // Cleric: heal doesn't overheal past maxHp
  const state = makeCombatState('cleric', {
    player: { hp: 95, maxHp: 100, mp: 20, maxMp: 20 },
  });
  const result = playerUseAbility(state, 'heal');
  assert(result.player.hp === 100, 'heal caps at maxHp (95+15 → 100)');
  assert(result.log.some(l => l.includes('healed for 5 HP')), 'heal log shows actual healing (5 not 15)');
}

{
  // Cleric: group-heal (10 HP, 12 MP, all-allies)
  const state = makeCombatState('cleric', {
    player: { hp: 50, maxHp: 100, mp: 20, maxMp: 20 },
  });
  const result = playerUseAbility(state, 'group-heal');
  assert(result.player.mp === 20 - 12, 'group-heal deducts 12 MP');
  assert(result.player.hp === 60, 'group-heal restores 10 HP');
}

// ══════════════════════════════════════════════════════════════════════
// SECTION 4: playerUseAbility — status effects on enemies
// ══════════════════════════════════════════════════════════════════════
console.log('\n--- playerUseAbility: status effects on enemies ---');

{
  // Warrior: shield-bash (0.8x + stun, 6 MP)
  const state = makeCombatState('warrior');
  const result = playerUseAbility(state, 'shield-bash');
  assert(result.player.mp === state.player.mp - 6, 'shield-bash deducts 6 MP');
  assert(result.enemy.hp < state.enemy.hp, 'shield-bash deals damage');
  const stunEffect = result.enemy.statusEffects.find(e => e.type === 'stun');
  assert(stunEffect !== undefined, 'shield-bash applies stun to enemy');
  assert(stunEffect && stunEffect.duration === 1, 'stun has duration 1');
  assert(result.log.some(l => l.includes('afflicted with Stun')), 'shield-bash logs stun application');
}

{
  // Rogue: poison-blade (1.0x + poison 3 turns, 6 MP)
  const state = makeCombatState('rogue');
  const result = playerUseAbility(state, 'poison-blade');
  const poisonEffect = result.enemy.statusEffects.find(e => e.type === 'poison');
  assert(poisonEffect !== undefined, 'poison-blade applies poison to enemy');
  assert(poisonEffect && poisonEffect.duration === 3, 'poison has duration 3');
  assert(poisonEffect && poisonEffect.power === 5, 'poison has power 5');
}

{
  // Mage: thunder-bolt (1.6x + spd-down 2 turns, 7 MP)
  const state = makeCombatState('mage');
  const result = playerUseAbility(state, 'thunder-bolt');
  const spdDown = result.enemy.statusEffects.find(e => e.type === 'spd-down');
  assert(spdDown !== undefined, 'thunder-bolt applies spd-down to enemy');
  assert(spdDown && spdDown.duration === 2, 'spd-down has duration 2');
}

{
  // Rogue: smoke-bomb (def-down on enemy, 7 MP, all-enemies)
  const state = makeCombatState('rogue');
  const result = playerUseAbility(state, 'smoke-bomb');
  const defDown = result.enemy.statusEffects.find(e => e.type === 'def-down');
  assert(defDown !== undefined, 'smoke-bomb applies def-down to enemy');
  // smoke-bomb has power=0, so no damage should occur
  assert(result.enemy.hp === state.enemy.hp, 'smoke-bomb with power 0 deals no damage');
}

// ══════════════════════════════════════════════════════════════════════
// SECTION 5: playerUseAbility — buffs on player
// ══════════════════════════════════════════════════════════════════════
console.log('\n--- playerUseAbility: buffs on player ---');

{
  // Warrior: war-cry (atk-up 3 turns, 5 MP, all-allies)
  const state = makeCombatState('warrior');
  const result = playerUseAbility(state, 'war-cry');
  assert(result.player.mp === state.player.mp - 5, 'war-cry deducts 5 MP');
  const atkUp = result.player.statusEffects.find(e => e.type === 'atk-up');
  assert(atkUp !== undefined, 'war-cry applies atk-up to player');
  assert(atkUp && atkUp.duration === 3, 'atk-up has duration 3');
  assert(result.log.some(l => l.includes('ATK Up')), 'war-cry logs buff application');
}

{
  // Mage: arcane-shield (def-up 3 turns, 5 MP, single-ally)
  const state = makeCombatState('mage');
  const result = playerUseAbility(state, 'arcane-shield');
  const defUp = result.player.statusEffects.find(e => e.type === 'def-up');
  assert(defUp !== undefined, 'arcane-shield applies def-up to player');
  assert(defUp && defUp.duration === 3, 'def-up has duration 3');
}

// ══════════════════════════════════════════════════════════════════════
// SECTION 6: playerUseAbility — cleanse (purify)
// ══════════════════════════════════════════════════════════════════════
console.log('\n--- playerUseAbility: cleanse ---');

{
  // Cleric: purify (cleanse debuffs + regen 3 turns, 8 MP)
  const state = makeCombatState('cleric', {
    player: {
      hp: 50, maxHp: 100, mp: 20, maxMp: 20,
      statusEffects: [
        { type: 'poison', name: 'Poison', duration: 2, power: 5 },
        { type: 'atk-up', name: 'ATK Up', duration: 1, power: 0 },
      ],
    },
  });
  const result = playerUseAbility(state, 'purify');
  assert(result.player.mp === 20 - 8, 'purify deducts 8 MP');
  // poison should be removed, atk-up should stay, regen should be added
  const hasPoison = result.player.statusEffects.some(e => e.type === 'poison');
  assert(!hasPoison, 'purify removes poison debuff');
  const hasAtkUp = result.player.statusEffects.some(e => e.type === 'atk-up');
  assert(hasAtkUp, 'purify keeps atk-up buff');
  const hasRegen = result.player.statusEffects.some(e => e.type === 'regen');
  assert(hasRegen, 'purify adds regen effect');
  assert(result.log.some(l => l.includes('purified')), 'purify logs cleanse');
  assert(result.log.some(l => l.includes('Regen')), 'purify logs regen');
}

// ══════════════════════════════════════════════════════════════════════
// SECTION 7: playerUseAbility — guards and edge cases
// ══════════════════════════════════════════════════════════════════════
console.log('\n--- playerUseAbility: guards and edge cases ---');

{
  // Wrong phase: should return state unchanged
  const state = makeCombatState('warrior');
  const wrongPhase = { ...state, phase: 'enemy-turn' };
  const result = playerUseAbility(wrongPhase, 'power-strike');
  assert(result.phase === 'enemy-turn', 'does nothing if not player-turn');
  assert(result.player.mp === wrongPhase.player.mp, 'MP unchanged when wrong phase');
}

{
  // Unknown ability
  const state = makeCombatState('warrior');
  const result = playerUseAbility(state, 'nonexistent-ability');
  assert(result.phase === 'player-turn', 'phase stays player-turn for unknown ability');
  assert(result.log.some(l => l.includes('Unknown ability')), 'logs unknown ability message');
}

{
  // Ability not in player's class (warrior using fireball)
  const state = makeCombatState('warrior');
  const result = playerUseAbility(state, 'fireball');
  assert(result.phase === 'player-turn', 'phase stays player-turn for wrong-class ability');
  assert(result.log.some(l => l.includes("don't know")), "logs \"don't know\" for wrong-class ability");
  assert(result.player.mp === state.player.mp, 'MP unchanged for wrong-class ability');
}

{
  // Not enough MP
  const state = makeCombatState('warrior', {
    player: { mp: 1, maxMp: 20 },
  });
  const result = playerUseAbility(state, 'power-strike'); // costs 4 MP
  assert(result.phase === 'player-turn', 'phase stays player-turn when not enough MP');
  assert(result.log.some(l => l.includes('Not enough MP')), 'logs not enough MP message');
  assert(result.player.mp === 1, 'MP unchanged when not enough');
}

{
  // Exactly enough MP (edge case)
  const state = makeCombatState('warrior', {
    player: { mp: 4, maxMp: 20 },
  });
  const result = playerUseAbility(state, 'power-strike'); // costs 4 MP
  assert(result.player.mp === 0, 'MP goes to 0 when exactly enough');
  assert(result.phase === 'enemy-turn', 'ability succeeds with exact MP');
}

{
  // Defending is cleared after using ability
  const state = makeCombatState('warrior', {
    player: { defending: true },
  });
  const result = playerUseAbility(state, 'power-strike');
  assert(result.player.defending === false, 'defending cleared after ability use');
}

// ══════════════════════════════════════════════════════════════════════
// SECTION 8: playerUseAbility — victory on kill
// ══════════════════════════════════════════════════════════════════════
console.log('\n--- playerUseAbility: victory on kill ---');

{
  // Enemy with 1 HP should die and trigger victory
  const state = makeCombatState('warrior', {
    player: { atk: 20, mp: 20, maxMp: 20 },
    enemy: { hp: 1, maxHp: 30, def: 0 },
  });
  const result = playerUseAbility(state, 'power-strike');
  assert(result.enemy.hp === 0, 'enemy hp is 0 after lethal ability');
  assert(result.phase === 'victory', 'phase transitions to victory on kill');
}

// ══════════════════════════════════════════════════════════════════════
// SECTION 9: addStatusEffect helper
// ══════════════════════════════════════════════════════════════════════
console.log('\n--- addStatusEffect helper ---');

{
  const state = makeCombatState('warrior');
  const effect = { type: 'poison', name: 'Poison', duration: 3, power: 5 };
  const result = addStatusEffect(state, 'enemy', effect);
  assert(result.enemy.statusEffects.length === 1, 'addStatusEffect adds one effect to enemy');
  assert(result.enemy.statusEffects[0].type === 'poison', 'added effect has correct type');
  assert(result.enemy.statusEffects[0].duration === 3, 'added effect has correct duration');
}

{
  const state = makeCombatState('warrior');
  const effect = { type: 'atk-up', name: 'ATK Up', duration: 3, power: 0 };
  const result = addStatusEffect(state, 'player', effect);
  assert(result.player.statusEffects.length === 1, 'addStatusEffect adds one effect to player');
  assert(result.player.statusEffects[0].type === 'atk-up', 'added player effect has correct type');
}

{
  // addStatusEffect on invalid target
  const state = makeCombatState('warrior');
  const effect = { type: 'poison', name: 'Poison', duration: 3, power: 5 };
  const result = addStatusEffect(state, 'nonexistent', effect);
  assert(result === state, 'addStatusEffect returns same state for invalid target');
}

// ══════════════════════════════════════════════════════════════════════
// SECTION 10: getAbility and getAbilityDisplayInfo
// ══════════════════════════════════════════════════════════════════════
console.log('\n--- getAbility and getAbilityDisplayInfo ---');

{
  const ability = getAbility('power-strike');
  assert(ability !== null, 'getAbility returns ability for valid id');
  assert(ability.id === 'power-strike', 'ability has correct id');
  assert(ability.mpCost === 4, 'power-strike costs 4 MP');
  assert(ability.power === 1.5, 'power-strike has power 1.5');
  assert(ability.class === 'warrior', 'power-strike is warrior class');
}

{
  const ability = getAbility('nonexistent');
  assert(ability === null, 'getAbility returns null for invalid id');
}

{
  const displayInfos = getAbilityDisplayInfo(['power-strike', 'shield-bash'], 5);
  assert(displayInfos.length === 2, 'getAbilityDisplayInfo returns info for both abilities');
  assert(displayInfos[0].name === 'Power Strike', 'first ability has correct name');
  assert(displayInfos[0].canUse === true, 'power-strike (4 MP) can be used with 5 MP');
  assert(displayInfos[1].name === 'Shield Bash', 'second ability has correct name');
  assert(displayInfos[1].canUse === false, 'shield-bash (6 MP) cannot be used with 5 MP');
}

{
  // Display info with unknown ability in the list
  const displayInfos = getAbilityDisplayInfo(['power-strike', 'fake-ability'], 20);
  assert(displayInfos.length === 1, 'getAbilityDisplayInfo filters out unknown abilities');
}

// ══════════════════════════════════════════════════════════════════════
// SECTION 11: state.js — abilities initialization
// ══════════════════════════════════════════════════════════════════════
console.log('\n--- state.js: abilities initialization ---');

{
  const warriorState = initialStateWithClass('warrior');
  assert(Array.isArray(warriorState.player.abilities), 'warrior player has abilities array');
  assert(warriorState.player.abilities.includes('power-strike'), 'warrior has power-strike');
  assert(warriorState.player.abilities.includes('shield-bash'), 'warrior has shield-bash');
  assert(warriorState.player.abilities.includes('war-cry'), 'warrior has war-cry');
  assert(typeof warriorState.player.spd === 'number', 'warrior player has spd stat');
}

{
  const mageState = initialStateWithClass('mage');
  assert(mageState.player.abilities.includes('fireball'), 'mage has fireball');
  assert(mageState.player.abilities.includes('arcane-shield'), 'mage has arcane-shield');
}

{
  const rogueState = initialStateWithClass('rogue');
  assert(rogueState.player.abilities.includes('backstab'), 'rogue has backstab');
  assert(rogueState.player.abilities.includes('poison-blade'), 'rogue has poison-blade');
}

{
  const clericState = initialStateWithClass('cleric');
  assert(clericState.player.abilities.includes('heal'), 'cleric has heal');
  assert(clericState.player.abilities.includes('purify'), 'cleric has purify');
  assert(clericState.player.abilities.includes('smite'), 'cleric has smite');
}

// ══════════════════════════════════════════════════════════════════════
// SECTION 12: Status effect format alignment with PR #49
// ══════════════════════════════════════════════════════════════════════
console.log('\n--- Status effect format alignment (PR #49 compatible) ---');

{
  // After using shield-bash, the stun effect should use 'duration' not 'remaining'
  const state = makeCombatState('warrior');
  const result = playerUseAbility(state, 'shield-bash');
  const stun = result.enemy.statusEffects[0];
  assert(stun.duration === 1, 'stun uses duration field (PR #49 format)');
  assert(stun.remaining === undefined, 'stun does NOT have remaining field');
  assert(stun.type === 'stun', 'stun has type field');
  assert(stun.name === 'Stun', 'stun has name field');
}

{
  // After using war-cry, the buff should use 'duration' not 'remaining'
  const state = makeCombatState('warrior');
  const result = playerUseAbility(state, 'war-cry');
  const atkUp = result.player.statusEffects[0];
  assert(atkUp.duration === 3, 'atk-up uses duration field (PR #49 format)');
  assert(atkUp.remaining === undefined, 'atk-up does NOT have remaining field');
}

// ══════════════════════════════════════════════════════════════════════
// SECTION 13: Easter egg scan
// ══════════════════════════════════════════════════════════════════════
console.log('\n--- Easter egg scan ---');

import { readFileSync } from 'fs';

{
  const filesToScan = [
    'src/combat.js',
    'src/state.js',
    'src/render.js',
    'src/main.js',
    'src/combat/abilities.js',
  ];
  const eggPatterns = [
    /easter/i, /\begg\b/i, /bunny/i, /rabbit/i, /hidden.*secret/i,
    /konami/i, /cheat/i, /back\s*door/i, /rick\s*roll/i,
  ];
  let cleanFiles = 0;
  for (const file of filesToScan) {
    try {
      const content = readFileSync(file, 'utf8');
      let foundEgg = false;
      for (const pat of eggPatterns) {
        if (pat.test(content)) {
          console.error(`  FAIL: ${file} matches easter egg pattern ${pat}`);
          failed++;
          foundEgg = true;
          break;
        }
      }
      if (!foundEgg) {
        cleanFiles++;
      }
    } catch (e) {
      // file not found is fine
      cleanFiles++;
    }
  }
  assert(cleanFiles === filesToScan.length, `All ${filesToScan.length} scanned files are easter-egg free`);
}

// ══════════════════════════════════════════════════════════════════════
// SUMMARY
// ══════════════════════════════════════════════════════════════════════
console.log(`\n========================================`);
console.log(`Combat Abilities Tests: ${passed} passed, ${failed} failed`);
console.log(`========================================`);
if (failed > 0) process.exit(1);
