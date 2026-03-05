#!/usr/bin/env node

import { ENEMIES, getEnemy } from '../src/data/enemies.js';
import { getAllClasses, getClassDefinition } from '../src/characters/classes.js';
import { calculateDamage } from '../src/combat/damage-calc.js';
import { getAbility } from '../src/combat/abilities.js';
import { xpToNextLevel } from '../src/characters/stats.js';

// Simple deterministic RNG
function createRng(seed = 1337) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) % 0x100000000;
    return state / 0x100000000;
  };
}

/**
 * Selects an action for the hero.
 * Strategy:
 * 1. If HP < 40% and has Heal, use Heal.
 * 2. If has offensive ability and enough MP, use strongest available.
 * 3. Else, basic attack.
 */
function pickAction(hero, classId, abilities) {
  const hpPercent = hero.hp / hero.maxHp;

  // 1. Heal Check
  if (hpPercent < 0.4) {
    const healAbility = abilities.find(a => a.healPower > 0 && hero.mp >= a.mpCost);
    if (healAbility) return healAbility;
  }

  // 2. Offensive Ability Check (Pick highest power)
  const offensiveAbilities = abilities
    .filter(a => a.power > 0 && hero.mp >= a.mpCost)
    .sort((a, b) => b.power - a.power);

  if (offensiveAbilities.length > 0) {
    return offensiveAbilities[0];
  }

  // 3. Basic Attack (null ability)
  return null;
}

function takeTurn({ attacker, target, ability, rngValue }) {
  // Healing
  if (ability && ability.healPower > 0) {
    const healAmount = ability.healPower; // Simplified; could scale with INT?
    // In actual game logic, healing might not scale with stats yet, 
    // but let's assume flat heal for now based on combat.js implementation.
    // Actually combat.js just uses healPower directly.
    return { type: 'heal', amount: healAmount };
  }

  // Damage
  const abilityPower = ability?.power ?? 1.0;
  // If ability is magical (fire, ice, lightning, light), use INT, else ATK
  // combat.js uses ATK for everything currently in playerUseAbility 
  // "const raw = Math.floor(atkStat * abilityPower) - defStat;"
  // So we will stick to that for now to match implementation.
  
  const { damage } = calculateDamage({
    attackerAtk: attacker.atk,
    targetDef: target.def,
    targetElement: target.element || null,
    rngValue,
    abilityPower,
  });
  
  return { type: 'damage', amount: damage };
}

export function simulateBattle(classId, enemyId, seed = 99) {
  const classDef = getClassDefinition(classId);
  if (!classDef) throw new Error(`Unknown class: ${classId}`);
  const enemy = getEnemy(enemyId);
  if (!enemy) throw new Error(`Unknown enemy: ${enemyId}`);

  // Hydrate abilities
  const knownAbilities = (classDef.abilities || [])
    .map(id => getAbility(id))
    .filter(Boolean);

  const hero = {
    hp: classDef.baseStats.hp,
    maxHp: classDef.baseStats.hp,
    mp: classDef.baseStats.mp,
    maxMp: classDef.baseStats.mp,
    atk: classDef.baseStats.atk,
    def: classDef.baseStats.def,
    spd: classDef.baseStats.spd,
    element: null,
  };

  const foe = {
    hp: enemy.hp,
    maxHp: enemy.hp,
    mp: enemy.mp,
    atk: enemy.atk,
    def: enemy.def,
    spd: enemy.spd,
    element: enemy.element ?? null,
  };

  const rng = createRng(seed + classId.length * 17 + enemyId.length * 31);
  let turns = 0;
  const log = [];

  while (hero.hp > 0 && foe.hp > 0 && turns < 200) {
    turns += 1;

    // --- Hero Turn ---
    const action = pickAction(hero, classId, knownAbilities);
    
    if (action) {
      hero.mp -= action.mpCost;
      const result = takeTurn({ attacker: hero, target: foe, ability: action, rngValue: rng() });
      if (result.type === 'heal') {
        hero.hp = Math.min(hero.maxHp, hero.hp + result.amount);
      } else {
        foe.hp -= result.amount;
      }
    } else {
      // Basic Attack
      const result = takeTurn({ attacker: hero, target: foe, ability: null, rngValue: rng() });
      foe.hp -= result.amount;
    }

    if (foe.hp <= 0) break;

    // --- Enemy Turn ---
    // Simple enemy AI: Attack
    const enemyResult = takeTurn({ attacker: foe, target: hero, ability: null, rngValue: rng() });
    hero.hp -= enemyResult.amount;
  }

  return {
    win: hero.hp > 0 && foe.hp <= 0,
    turns,
    remainingHp: Math.max(0, Math.floor(hero.hp)),
    remainingMp: Math.max(0, Math.floor(hero.mp)),
  };
}

function runMatrix() {
  const classes = getAllClasses();
  const enemies = Object.values(ENEMIES);
  const warnings = [];

  console.log('=== Balance Matrix (Lvl 1) ===');
  console.log('Legend: Win/Loss : Turns : HP% : MP Rem');
  
  // Header
  const header = ['Class'].concat(enemies.map(e => e.name.substring(0, 8)));
  console.log(header.map(s => s.padEnd(12)).join(''));

  classes.forEach((cls) => {
    let rowStr = cls.name.padEnd(12);
    
    enemies.forEach((enemy) => {
      const result = simulateBattle(cls.id, enemy.id);
      const outcome = result.win ? 'W' : 'L';
      const hpPercent = Math.round((result.remainingHp / cls.baseStats.hp) * 100);
      const cell = `${outcome}:${result.turns} (${hpPercent}%)`;
      rowStr += cell.padEnd(12);

      if (!result.win && (enemy.id === 'slime' || enemy.id === 'goblin')) {
        warnings.push(`${cls.name} loses to a ${enemy.name} (Lvl 1)`);
      }
      if (result.win && enemy.id === 'dragon') {
        warnings.push(`${cls.name} beats a Dragon at Lvl 1 (unexpected)`);
      }
    });
    console.log(rowStr);
  });

  if (warnings.length) {
    console.log('\nWarnings:');
    warnings.forEach((msg) => console.warn(` - ${msg}`));
  } else {
    console.log('\nBalance Check: OK (No obvious issues)');
  }
}

function printXpToLevel2() {
  const xpNeeded = xpToNextLevel(0);
  const slimeXp = ENEMIES.slime?.xpReward ?? 1;
  const slimesNeeded = Math.ceil(xpNeeded / slimeXp);

  console.log('\n=== XP to Level 2 ===');
  console.log(`XP required: ${xpNeeded}`);
  console.log(`Slimes needed: ${slimesNeeded} (at ${slimeXp} XP each)`);
}

function main() {
  runMatrix();
  printXpToLevel2();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
