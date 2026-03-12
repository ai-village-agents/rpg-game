/**
 * Status Effects System Tests
 * Tests for status effects, buffs, debuffs, and UI components
 */

import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';

import {
  STATUS_TYPES,
  STATUS_DATA,
  EFFECT_CATEGORIES,
  getStatusData,
  createStatusEffect,
  applyStatusEffect,
  removeStatusEffect,
  clearStatusCategory,
  clearBuffsOrDebuffs,
  processStatusTick,
  applyStatusModifiers,
  canEntityAct,
  canUseSkills,
  isTargetable,
  getForcedTarget,
  processIncomingDamage,
  getActiveStatusEffects,
  getBuffs,
  getDebuffs,
  hasStatus,
  getStatusStacks,
  getAllStatusTypes,
  getAllStatusData,
} from '../src/status-effects.js';

import {
  getStatusEffectsStyles,
  renderStatusIcon,
  renderStatusEffects,
  renderStatusBar,
  renderStatusAppliedNotice,
  renderStatusRemovedNotice,
  renderTickResults,
  renderStatusPanel,
  renderStatusCatalog,
  renderCannotActNotice,
} from '../src/status-effects-ui.js';

// Banned words for security testing
const BANNED_WORDS = ['egg', 'easter', 'yolk', 'bunny', 'rabbit', 'phoenix'];

describe('Status Types', () => {
  it('should define damage over time effects', () => {
    assert.ok(STATUS_TYPES.POISON);
    assert.ok(STATUS_TYPES.BURN);
    assert.ok(STATUS_TYPES.BLEED);
    assert.ok(STATUS_TYPES.CURSE);
  });

  it('should define heal over time effects', () => {
    assert.ok(STATUS_TYPES.REGEN);
    assert.ok(STATUS_TYPES.MANA_REGEN);
  });

  it('should define stat buff effects', () => {
    assert.ok(STATUS_TYPES.ATTACK_UP);
    assert.ok(STATUS_TYPES.DEFENSE_UP);
    assert.ok(STATUS_TYPES.SPEED_UP);
    assert.ok(STATUS_TYPES.MAGIC_UP);
    assert.ok(STATUS_TYPES.CRIT_UP);
  });

  it('should define stat debuff effects', () => {
    assert.ok(STATUS_TYPES.ATTACK_DOWN);
    assert.ok(STATUS_TYPES.DEFENSE_DOWN);
    assert.ok(STATUS_TYPES.SPEED_DOWN);
    assert.ok(STATUS_TYPES.MAGIC_DOWN);
    assert.ok(STATUS_TYPES.ACCURACY_DOWN);
  });

  it('should define control effects', () => {
    assert.ok(STATUS_TYPES.STUN);
    assert.ok(STATUS_TYPES.FREEZE);
    assert.ok(STATUS_TYPES.SLEEP);
    assert.ok(STATUS_TYPES.CONFUSE);
    assert.ok(STATUS_TYPES.SILENCE);
  });

  it('should define shield effects', () => {
    assert.ok(STATUS_TYPES.BARRIER);
    assert.ok(STATUS_TYPES.REFLECT);
    assert.ok(STATUS_TYPES.ABSORB);
  });

  it('should define special effects', () => {
    assert.ok(STATUS_TYPES.INVINCIBLE);
    assert.ok(STATUS_TYPES.TAUNT);
    assert.ok(STATUS_TYPES.STEALTH);
    assert.ok(STATUS_TYPES.BERSERK);
  });
});

describe('Status Data', () => {
  it('should have data for all status types', () => {
    for (const type of Object.values(STATUS_TYPES)) {
      assert.ok(STATUS_DATA[type], `Missing data for ${type}`);
    }
  });

  it('should have required fields for all statuses', () => {
    for (const [type, data] of Object.entries(STATUS_DATA)) {
      assert.ok(data.name, `${type} missing name`);
      assert.ok(data.icon, `${type} missing icon`);
      assert.ok(data.category, `${type} missing category`);
      assert.ok(data.description, `${type} missing description`);
      assert.ok(typeof data.defaultDuration === 'number', `${type} missing defaultDuration`);
    }
  });

  it('should have tick damage for DOT effects', () => {
    const dotTypes = [STATUS_TYPES.POISON, STATUS_TYPES.BURN, STATUS_TYPES.BLEED, STATUS_TYPES.CURSE];
    for (const type of dotTypes) {
      assert.ok(STATUS_DATA[type].tickDamage, `${type} missing tickDamage`);
    }
  });

  it('should have tick heal for HOT effects', () => {
    assert.ok(STATUS_DATA[STATUS_TYPES.REGEN].tickHeal);
    assert.ok(STATUS_DATA[STATUS_TYPES.MANA_REGEN].tickMana);
  });
});

describe('getStatusData', () => {
  it('should return data for valid status type', () => {
    const data = getStatusData(STATUS_TYPES.POISON);
    assert.ok(data);
    assert.strictEqual(data.name, 'Poison');
  });

  it('should return null for invalid status type', () => {
    const data = getStatusData('invalid-status');
    assert.strictEqual(data, null);
  });

  it('should return null for null input', () => {
    const data = getStatusData(null);
    assert.strictEqual(data, null);
  });
});

describe('createStatusEffect', () => {
  it('should create effect with default values', () => {
    const effect = createStatusEffect(STATUS_TYPES.POISON);
    assert.ok(effect);
    assert.strictEqual(effect.type, STATUS_TYPES.POISON);
    assert.strictEqual(effect.name, 'Poison');
    assert.strictEqual(effect.duration, 3);
    assert.strictEqual(effect.turnsRemaining, 3);
    assert.strictEqual(effect.potency, 1.0);
    assert.strictEqual(effect.stacks, 1);
  });

  it('should create effect with custom duration', () => {
    const effect = createStatusEffect(STATUS_TYPES.POISON, { duration: 5 });
    assert.strictEqual(effect.duration, 5);
    assert.strictEqual(effect.turnsRemaining, 5);
  });

  it('should create effect with custom potency', () => {
    const effect = createStatusEffect(STATUS_TYPES.BURN, { potency: 1.5 });
    assert.strictEqual(effect.potency, 1.5);
  });

  it('should create stackable effect with stacks', () => {
    const effect = createStatusEffect(STATUS_TYPES.POISON, { stacks: 3 });
    assert.strictEqual(effect.stacks, 3);
  });

  it('should cap stacks at max', () => {
    const effect = createStatusEffect(STATUS_TYPES.POISON, { stacks: 10 });
    assert.strictEqual(effect.stacks, 5); // maxStacks is 5
  });

  it('should return null for invalid status type', () => {
    const effect = createStatusEffect('invalid');
    assert.strictEqual(effect, null);
  });

  it('should create barrier with shield amount', () => {
    const effect = createStatusEffect(STATUS_TYPES.BARRIER);
    assert.strictEqual(effect.shieldRemaining, 50);
  });
});

describe('applyStatusEffect', () => {
  it('should apply new status to entity', () => {
    const entity = { hp: 100, statusEffects: [] };
    const result = applyStatusEffect(entity, STATUS_TYPES.POISON);
    
    assert.ok(result.applied);
    assert.ok(!result.refreshed);
    assert.strictEqual(result.entity.statusEffects.length, 1);
    assert.strictEqual(result.entity.statusEffects[0].type, STATUS_TYPES.POISON);
  });

  it('should refresh duration for existing non-stackable effect', () => {
    const entity = {
      hp: 100,
      statusEffects: [createStatusEffect(STATUS_TYPES.BURN)],
    };
    entity.statusEffects[0].turnsRemaining = 1;
    
    const result = applyStatusEffect(entity, STATUS_TYPES.BURN);
    
    assert.ok(result.applied);
    assert.ok(result.refreshed);
    assert.strictEqual(result.entity.statusEffects.length, 1);
    assert.strictEqual(result.entity.statusEffects[0].turnsRemaining, 3);
  });

  it('should add stacks for stackable effects', () => {
    const entity = {
      hp: 100,
      statusEffects: [createStatusEffect(STATUS_TYPES.POISON, { stacks: 2 })],
    };
    
    const result = applyStatusEffect(entity, STATUS_TYPES.POISON, { stacks: 2 });
    
    assert.ok(result.applied);
    assert.strictEqual(result.entity.statusEffects[0].stacks, 4);
  });

  it('should not exceed max stacks', () => {
    const entity = {
      hp: 100,
      statusEffects: [createStatusEffect(STATUS_TYPES.POISON, { stacks: 4 })],
    };
    
    const result = applyStatusEffect(entity, STATUS_TYPES.POISON, { stacks: 3 });
    assert.strictEqual(result.entity.statusEffects[0].stacks, 5);
  });

  it('should respect immunity', () => {
    const entity = {
      hp: 100,
      statusEffects: [],
      statusImmunities: [STATUS_TYPES.POISON],
    };
    
    const result = applyStatusEffect(entity, STATUS_TYPES.POISON);
    
    assert.ok(!result.applied);
    assert.strictEqual(result.reason, 'immune');
  });

  it('should handle null entity', () => {
    const result = applyStatusEffect(null, STATUS_TYPES.POISON);
    assert.ok(!result.applied);
    assert.strictEqual(result.reason, 'invalid_entity');
  });

  it('should handle invalid status type', () => {
    const entity = { hp: 100, statusEffects: [] };
    const result = applyStatusEffect(entity, 'invalid');
    assert.ok(!result.applied);
    assert.strictEqual(result.reason, 'invalid_status');
  });
});

describe('removeStatusEffect', () => {
  it('should remove status effect', () => {
    const entity = {
      hp: 100,
      statusEffects: [
        createStatusEffect(STATUS_TYPES.POISON),
        createStatusEffect(STATUS_TYPES.BURN),
      ],
    };
    
    const result = removeStatusEffect(entity, STATUS_TYPES.POISON);
    
    assert.strictEqual(result.statusEffects.length, 1);
    assert.strictEqual(result.statusEffects[0].type, STATUS_TYPES.BURN);
  });

  it('should handle entity without status effects', () => {
    const entity = { hp: 100 };
    const result = removeStatusEffect(entity, STATUS_TYPES.POISON);
    assert.strictEqual(result, entity);
  });

  it('should handle null entity', () => {
    const result = removeStatusEffect(null, STATUS_TYPES.POISON);
    assert.strictEqual(result, null);
  });
});

describe('clearStatusCategory', () => {
  it('should clear all DOT effects', () => {
    const entity = {
      hp: 100,
      statusEffects: [
        createStatusEffect(STATUS_TYPES.POISON),
        createStatusEffect(STATUS_TYPES.BURN),
        createStatusEffect(STATUS_TYPES.ATTACK_UP),
      ],
    };
    
    const result = clearStatusCategory(entity, EFFECT_CATEGORIES.DAMAGE_OVER_TIME);
    
    assert.strictEqual(result.statusEffects.length, 1);
    assert.strictEqual(result.statusEffects[0].type, STATUS_TYPES.ATTACK_UP);
  });
});

describe('clearBuffsOrDebuffs', () => {
  it('should clear all buffs', () => {
    const entity = {
      hp: 100,
      statusEffects: [
        createStatusEffect(STATUS_TYPES.ATTACK_UP),
        createStatusEffect(STATUS_TYPES.DEFENSE_UP),
        createStatusEffect(STATUS_TYPES.ATTACK_DOWN),
      ],
    };
    
    const result = clearBuffsOrDebuffs(entity, true);
    
    assert.strictEqual(result.statusEffects.length, 1);
    assert.strictEqual(result.statusEffects[0].type, STATUS_TYPES.ATTACK_DOWN);
  });

  it('should clear all debuffs', () => {
    const entity = {
      hp: 100,
      statusEffects: [
        createStatusEffect(STATUS_TYPES.ATTACK_UP),
        createStatusEffect(STATUS_TYPES.ATTACK_DOWN),
      ],
    };
    
    const result = clearBuffsOrDebuffs(entity, false);
    
    assert.strictEqual(result.statusEffects.length, 1);
    assert.strictEqual(result.statusEffects[0].type, STATUS_TYPES.ATTACK_UP);
  });
});

describe('processStatusTick', () => {
  it('should deal DOT damage', () => {
    const entity = {
      hp: 100,
      currentHp: 100,
      maxHp: 100,
      statusEffects: [createStatusEffect(STATUS_TYPES.POISON)],
    };
    
    const { entity: updated, results } = processStatusTick(entity);
    
    assert.ok(updated.hp < 100);
    assert.ok(results.some(r => r.damage));
  });

  it('should heal with HOT effects', () => {
    const entity = {
      hp: 50,
      currentHp: 50,
      maxHp: 100,
      statusEffects: [createStatusEffect(STATUS_TYPES.REGEN)],
    };
    
    const { entity: updated, results } = processStatusTick(entity);
    
    assert.ok(updated.hp > 50);
    assert.ok(results.some(r => r.heal));
  });

  it('should restore mana with mana regen', () => {
    const entity = {
      hp: 100,
      mp: 50,
      currentMp: 50,
      maxMp: 100,
      statusEffects: [createStatusEffect(STATUS_TYPES.MANA_REGEN)],
    };
    
    const { entity: updated, results } = processStatusTick(entity);
    
    assert.ok(updated.mp > 50);
    assert.ok(results.some(r => r.mana));
  });

  it('should decrement duration', () => {
    const entity = {
      hp: 100,
      currentHp: 100,
      maxHp: 100,
      statusEffects: [createStatusEffect(STATUS_TYPES.POISON)],
    };
    
    const { entity: updated } = processStatusTick(entity);
    
    assert.strictEqual(updated.statusEffects[0].turnsRemaining, 2);
  });

  it('should remove expired effects', () => {
    const effect = createStatusEffect(STATUS_TYPES.POISON);
    effect.turnsRemaining = 1;
    const entity = {
      hp: 100,
      currentHp: 100,
      maxHp: 100,
      statusEffects: [effect],
    };
    
    const { entity: updated, results } = processStatusTick(entity);
    
    assert.strictEqual(updated.statusEffects.length, 0);
    assert.ok(results.some(r => r.expired));
  });

  it('should prevent healing when cursed', () => {
    const entity = {
      hp: 50,
      currentHp: 50,
      maxHp: 100,
      statusEffects: [
        createStatusEffect(STATUS_TYPES.REGEN),
        createStatusEffect(STATUS_TYPES.CURSE),
      ],
    };
    
    const { results } = processStatusTick(entity);
    
    assert.ok(results.some(r => r.healPrevented));
  });

  it('should apply stacks multiplier to damage', () => {
    const entity1 = {
      hp: 100,
      currentHp: 100,
      maxHp: 100,
      statusEffects: [createStatusEffect(STATUS_TYPES.POISON, { stacks: 1 })],
    };
    
    const entity2 = {
      hp: 100,
      currentHp: 100,
      maxHp: 100,
      statusEffects: [createStatusEffect(STATUS_TYPES.POISON, { stacks: 3 })],
    };
    
    const { results: r1 } = processStatusTick(entity1);
    const { results: r2 } = processStatusTick(entity2);
    
    const dmg1 = r1.find(r => r.damage)?.damage || 0;
    const dmg2 = r2.find(r => r.damage)?.damage || 0;
    
    assert.ok(dmg2 > dmg1);
  });
});

describe('applyStatusModifiers', () => {
  it('should apply attack buff', () => {
    const baseStats = { attack: 100 };
    const effects = [createStatusEffect(STATUS_TYPES.ATTACK_UP)];
    
    const modified = applyStatusModifiers(baseStats, effects);
    
    assert.strictEqual(modified.attack, 125); // +25%
  });

  it('should apply attack debuff', () => {
    const baseStats = { attack: 100 };
    const effects = [createStatusEffect(STATUS_TYPES.ATTACK_DOWN)];
    
    const modified = applyStatusModifiers(baseStats, effects);
    
    assert.strictEqual(modified.attack, 80); // -20%
  });

  it('should apply multiple modifiers', () => {
    const baseStats = { attack: 100, defense: 100 };
    const effects = [
      createStatusEffect(STATUS_TYPES.ATTACK_UP),
      createStatusEffect(STATUS_TYPES.DEFENSE_DOWN),
    ];
    
    const modified = applyStatusModifiers(baseStats, effects);
    
    assert.strictEqual(modified.attack, 125);
    assert.strictEqual(modified.defense, 75);
  });

  it('should handle empty effects', () => {
    const baseStats = { attack: 100 };
    const modified = applyStatusModifiers(baseStats, []);
    assert.strictEqual(modified.attack, 100);
  });

  it('should handle null inputs', () => {
    assert.strictEqual(applyStatusModifiers(null, []), null);
    const result = applyStatusModifiers({ attack: 100 }, null);
    assert.strictEqual(result.attack, 100);
  });
});

describe('canEntityAct', () => {
  it('should return true for no status effects', () => {
    const entity = { hp: 100, statusEffects: [] };
    const result = canEntityAct(entity);
    assert.ok(result.canAct);
  });

  it('should return false when stunned', () => {
    const entity = {
      hp: 100,
      statusEffects: [createStatusEffect(STATUS_TYPES.STUN)],
    };
    const result = canEntityAct(entity);
    assert.ok(!result.canAct);
    assert.strictEqual(result.reason, STATUS_TYPES.STUN);
  });

  it('should return false when frozen', () => {
    const entity = {
      hp: 100,
      statusEffects: [createStatusEffect(STATUS_TYPES.FREEZE)],
    };
    const result = canEntityAct(entity);
    assert.ok(!result.canAct);
  });

  it('should return false when asleep', () => {
    const entity = {
      hp: 100,
      statusEffects: [createStatusEffect(STATUS_TYPES.SLEEP)],
    };
    const result = canEntityAct(entity);
    assert.ok(!result.canAct);
  });
});

describe('canUseSkills', () => {
  it('should return true normally', () => {
    const entity = { hp: 100, statusEffects: [] };
    assert.ok(canUseSkills(entity));
  });

  it('should return false when silenced', () => {
    const entity = {
      hp: 100,
      statusEffects: [createStatusEffect(STATUS_TYPES.SILENCE)],
    };
    assert.ok(!canUseSkills(entity));
  });
});

describe('isTargetable', () => {
  it('should return true normally', () => {
    const entity = { hp: 100, statusEffects: [] };
    assert.ok(isTargetable(entity));
  });

  it('should return false when stealthed', () => {
    const entity = {
      hp: 100,
      statusEffects: [createStatusEffect(STATUS_TYPES.STEALTH)],
    };
    assert.ok(!isTargetable(entity));
  });
});

describe('getForcedTarget', () => {
  it('should return null with no taunt', () => {
    const entities = [
      { hp: 100, statusEffects: [] },
      { hp: 100, statusEffects: [] },
    ];
    assert.strictEqual(getForcedTarget(entities), null);
  });

  it('should return entity with taunt', () => {
    const taunter = {
      hp: 100,
      name: 'Tank',
      statusEffects: [createStatusEffect(STATUS_TYPES.TAUNT)],
    };
    const entities = [
      { hp: 100, statusEffects: [] },
      taunter,
    ];
    assert.strictEqual(getForcedTarget(entities), taunter);
  });
});

describe('processIncomingDamage', () => {
  it('should return original damage with no effects', () => {
    const target = { hp: 100, statusEffects: [] };
    const result = processIncomingDamage(target, 50);
    assert.strictEqual(result.damage, 50);
  });

  it('should block damage with invincibility', () => {
    const target = {
      hp: 100,
      statusEffects: [createStatusEffect(STATUS_TYPES.INVINCIBLE)],
    };
    const result = processIncomingDamage(target, 50);
    assert.strictEqual(result.damage, 0);
    assert.ok(result.effects.some(e => e.type === 'immune'));
  });

  it('should absorb damage with barrier', () => {
    const target = {
      hp: 100,
      statusEffects: [createStatusEffect(STATUS_TYPES.BARRIER)],
    };
    const result = processIncomingDamage(target, 30);
    assert.strictEqual(result.damage, 0);
    assert.strictEqual(result.absorbed, 30);
    assert.ok(result.statusEffects[0].shieldRemaining === 20);
  });

  it('should break barrier when depleted', () => {
    const target = {
      hp: 100,
      statusEffects: [createStatusEffect(STATUS_TYPES.BARRIER)],
    };
    const result = processIncomingDamage(target, 60);
    assert.strictEqual(result.absorbed, 50);
    assert.strictEqual(result.damage, 10);
    assert.strictEqual(result.statusEffects.length, 0);
    assert.ok(result.effects.some(e => e.type === 'shield_break'));
  });

  it('should apply bonus damage to frozen targets', () => {
    const target = {
      hp: 100,
      statusEffects: [createStatusEffect(STATUS_TYPES.FREEZE)],
    };
    const result = processIncomingDamage(target, 50);
    assert.strictEqual(result.damage, 75); // 1.5x
    assert.ok(result.effects.some(e => e.type === 'break'));
  });

  it('should break sleep on damage', () => {
    const target = {
      hp: 100,
      statusEffects: [createStatusEffect(STATUS_TYPES.SLEEP)],
    };
    const result = processIncomingDamage(target, 10);
    assert.strictEqual(result.statusEffects.length, 0);
    assert.ok(result.effects.some(e => e.type === 'break'));
  });
});

describe('getActiveStatusEffects', () => {
  it('should return empty array for no effects', () => {
    const entity = { hp: 100, statusEffects: [] };
    assert.deepStrictEqual(getActiveStatusEffects(entity), []);
  });

  it('should return effects with data attached', () => {
    const entity = {
      hp: 100,
      statusEffects: [createStatusEffect(STATUS_TYPES.POISON)],
    };
    const effects = getActiveStatusEffects(entity);
    assert.strictEqual(effects.length, 1);
    assert.ok(effects[0].data);
    assert.strictEqual(effects[0].data.name, 'Poison');
  });
});

describe('getBuffs and getDebuffs', () => {
  it('should separate buffs and debuffs', () => {
    const entity = {
      hp: 100,
      statusEffects: [
        createStatusEffect(STATUS_TYPES.ATTACK_UP),
        createStatusEffect(STATUS_TYPES.DEFENSE_UP),
        createStatusEffect(STATUS_TYPES.ATTACK_DOWN),
        createStatusEffect(STATUS_TYPES.POISON),
      ],
    };
    
    const buffs = getBuffs(entity);
    const debuffs = getDebuffs(entity);
    
    assert.strictEqual(buffs.length, 2);
    assert.strictEqual(debuffs.length, 2);
  });
});

describe('hasStatus and getStatusStacks', () => {
  it('should detect status presence', () => {
    const entity = {
      hp: 100,
      statusEffects: [createStatusEffect(STATUS_TYPES.POISON)],
    };
    assert.ok(hasStatus(entity, STATUS_TYPES.POISON));
    assert.ok(!hasStatus(entity, STATUS_TYPES.BURN));
  });

  it('should return stack count', () => {
    const entity = {
      hp: 100,
      statusEffects: [createStatusEffect(STATUS_TYPES.POISON, { stacks: 3 })],
    };
    assert.strictEqual(getStatusStacks(entity, STATUS_TYPES.POISON), 3);
    assert.strictEqual(getStatusStacks(entity, STATUS_TYPES.BURN), 0);
  });
});

describe('getAllStatusTypes', () => {
  it('should return all status types', () => {
    const types = getAllStatusTypes();
    assert.ok(Array.isArray(types));
    assert.ok(types.length > 20);
    assert.ok(types.includes(STATUS_TYPES.POISON));
  });
});

describe('UI Components', () => {
  describe('getStatusEffectsStyles', () => {
    it('should return CSS styles', () => {
      const styles = getStatusEffectsStyles();
      assert.ok(typeof styles === 'string');
      assert.ok(styles.includes('.status-effects-container'));
      assert.ok(styles.includes('.status-effect-icon'));
    });
  });

  describe('renderStatusIcon', () => {
    it('should render status icon with duration', () => {
      const effect = createStatusEffect(STATUS_TYPES.POISON);
      const html = renderStatusIcon(effect);
      assert.ok(html.includes('status-effect-icon'));
      assert.ok(html.includes('status-duration'));
      assert.ok(html.includes('3'));
    });

    it('should show stacks for stackable effects', () => {
      const effect = createStatusEffect(STATUS_TYPES.POISON, { stacks: 3 });
      const html = renderStatusIcon(effect);
      assert.ok(html.includes('status-stacks'));
    });
  });

  describe('renderStatusEffects', () => {
    it('should render all status effects', () => {
      const entity = {
        hp: 100,
        statusEffects: [
          createStatusEffect(STATUS_TYPES.POISON),
          createStatusEffect(STATUS_TYPES.BURN),
        ],
      };
      const html = renderStatusEffects(entity);
      assert.ok(html.includes('status-effects-container'));
    });

    it('should return empty string for no effects', () => {
      const entity = { hp: 100, statusEffects: [] };
      assert.strictEqual(renderStatusEffects(entity), '');
    });
  });

  describe('renderStatusBar', () => {
    it('should render compact status bar', () => {
      const entity = {
        hp: 100,
        statusEffects: [createStatusEffect(STATUS_TYPES.POISON)],
      };
      const html = renderStatusBar(entity);
      assert.ok(html.includes('status-bar'));
    });
  });

  describe('renderStatusAppliedNotice', () => {
    it('should render applied notice', () => {
      const effect = createStatusEffect(STATUS_TYPES.POISON);
      const html = renderStatusAppliedNotice(effect, 'Hero', false);
      assert.ok(html.includes('applied to'));
      assert.ok(html.includes('Hero'));
    });

    it('should render refreshed notice', () => {
      const effect = createStatusEffect(STATUS_TYPES.POISON);
      const html = renderStatusAppliedNotice(effect, 'Hero', true);
      assert.ok(html.includes('refreshed on'));
    });
  });

  describe('renderStatusRemovedNotice', () => {
    it('should render removed notice', () => {
      const html = renderStatusRemovedNotice(STATUS_TYPES.POISON, 'Hero');
      assert.ok(html.includes('wore off'));
      assert.ok(html.includes('Hero'));
    });
  });

  describe('renderTickResults', () => {
    it('should render damage results', () => {
      const results = [{ type: STATUS_TYPES.POISON, name: 'Poison', damage: 10 }];
      const html = renderTickResults(results, 'Hero');
      assert.ok(html.includes('took 10 damage'));
    });

    it('should render heal results', () => {
      const results = [{ type: STATUS_TYPES.REGEN, name: 'Regen', heal: 15 }];
      const html = renderTickResults(results, 'Hero');
      assert.ok(html.includes('recovered 15 HP'));
    });
  });

  describe('renderStatusPanel', () => {
    it('should render detailed panel', () => {
      const entity = {
        name: 'Hero',
        hp: 100,
        statusEffects: [
          createStatusEffect(STATUS_TYPES.ATTACK_UP),
          createStatusEffect(STATUS_TYPES.POISON),
        ],
      };
      const html = renderStatusPanel(entity);
      assert.ok(html.includes('Hero'));
      assert.ok(html.includes('Buffs'));
      assert.ok(html.includes('Debuffs'));
    });
  });

  describe('renderStatusCatalog', () => {
    it('should render all status categories', () => {
      const html = renderStatusCatalog();
      assert.ok(html.includes('Damage Over Time'));
      assert.ok(html.includes('Control Effects'));
      assert.ok(html.includes('Shield Effects'));
    });
  });

  describe('renderCannotActNotice', () => {
    it('should render cannot act notice', () => {
      const html = renderCannotActNotice('Hero', 'Stunned');
      assert.ok(html.includes('cannot act'));
      assert.ok(html.includes('Stunned'));
    });
  });
});

describe('Security Tests', () => {
  it('should not contain banned words in status names', () => {
    for (const [type, data] of Object.entries(STATUS_DATA)) {
      for (const banned of BANNED_WORDS) {
        assert.ok(
          !data.name.toLowerCase().includes(banned),
          `Status ${type} name contains banned word "${banned}"`
        );
      }
    }
  });

  it('should not contain banned words in status descriptions', () => {
    for (const [type, data] of Object.entries(STATUS_DATA)) {
      for (const banned of BANNED_WORDS) {
        assert.ok(
          !data.description.toLowerCase().includes(banned),
          `Status ${type} description contains banned word "${banned}"`
        );
      }
    }
  });

  it('should not contain banned words in status types', () => {
    for (const type of Object.values(STATUS_TYPES)) {
      for (const banned of BANNED_WORDS) {
        assert.ok(
          !type.toLowerCase().includes(banned),
          `Status type "${type}" contains banned word "${banned}"`
        );
      }
    }
  });

  it('should escape HTML in UI rendering', () => {
    const effect = createStatusEffect(STATUS_TYPES.POISON);
    const html = renderStatusIcon(effect);
    assert.ok(!html.includes('<script>'));
    assert.ok(!html.includes('javascript:'));
  });
});

describe('Edge Cases', () => {
  it('should handle undefined entity gracefully', () => {
    assert.doesNotThrow(() => {
      canEntityAct(undefined);
      canUseSkills(undefined);
      isTargetable(undefined);
      getActiveStatusEffects(undefined);
      processStatusTick(undefined);
    });
  });

  it('should handle empty arrays', () => {
    assert.strictEqual(getForcedTarget([]), null);
    assert.deepStrictEqual(applyStatusModifiers({}, []), {});
  });

  it('should handle entity without statusEffects array', () => {
    const entity = { hp: 100 };
    assert.ok(canEntityAct(entity).canAct);
    assert.ok(canUseSkills(entity));
    assert.ok(isTargetable(entity));
  });
});
