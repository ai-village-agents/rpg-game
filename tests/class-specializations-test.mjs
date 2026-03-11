/**
 * Class Specializations Tests
 * Coverage for specialization data and core behaviors.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  SPECIALIZATION_LEVEL,
  SPECIALIZATIONS,
  getSpecializationsForClass,
  getSpecialization,
  canSpecialize,
  applySpecialization,
  isSpecialized,
  getSpecializationInfo,
  getAllSpecializations,
  getSpecializationPassive
} from '../src/class-specializations.js';

const baseWarrior = {
  level: 5,
  classId: 'warrior',
  hp: 50,
  maxHp: 50,
  mp: 15,
  maxMp: 15,
  atk: 12,
  def: 10,
  spd: 6,
  int: 3,
  lck: 5,
  abilities: ['power-strike', 'shield-bash', 'war-cry']
};

const baseMage = {
  level: 5,
  classId: 'mage',
  stats: {
    hp: 28,
    maxHp: 28,
    mp: 50,
    maxMp: 50,
    atk: 6,
    def: 4,
    spd: 5,
    int: 14,
    lck: 6
  },
  abilities: ['fireball', 'blizzard']
};

const clone = (value) => JSON.parse(JSON.stringify(value));

// ============================================================================
// SPECIALIZATIONS data validation
// ============================================================================

describe('SPECIALIZATIONS data validation', () => {
  it('has all 4 classes', () => {
    const classIds = Object.keys(SPECIALIZATIONS).sort();
    assert.deepStrictEqual(classIds, ['cleric', 'mage', 'rogue', 'warrior']);
  });

  it('each class has exactly 2 specializations', () => {
    for (const classSpecs of Object.values(SPECIALIZATIONS)) {
      assert.strictEqual(Object.keys(classSpecs).length, 2);
    }
  });

  it('every specialization has required fields', () => {
    const required = ['id', 'name', 'description', 'statBonuses', 'abilities', 'passive'];
    const passiveFields = ['id', 'name', 'description', 'type'];

    for (const classSpecs of Object.values(SPECIALIZATIONS)) {
      for (const spec of Object.values(classSpecs)) {
        for (const field of required) {
          assert.ok(spec[field] !== undefined, `Missing ${field} for ${spec.id}`);
        }
        assert.ok(Array.isArray(spec.abilities), `Abilities should be array for ${spec.id}`);
        for (const field of passiveFields) {
          assert.ok(
            spec.passive && spec.passive[field] !== undefined,
            `Missing passive.${field} for ${spec.id}`
          );
        }
      }
    }
  });

  it('SPECIALIZATION_LEVEL is 5', () => {
    assert.strictEqual(SPECIALIZATION_LEVEL, 5);
  });
});

// ============================================================================
// getSpecializationsForClass
// ============================================================================

describe('getSpecializationsForClass', () => {
  it('returns 2 specs for warrior', () => {
    assert.strictEqual(getSpecializationsForClass('warrior').length, 2);
  });

  it('returns 2 specs for mage', () => {
    assert.strictEqual(getSpecializationsForClass('mage').length, 2);
  });

  it('returns 2 specs for rogue', () => {
    assert.strictEqual(getSpecializationsForClass('rogue').length, 2);
  });

  it('returns 2 specs for cleric', () => {
    assert.strictEqual(getSpecializationsForClass('cleric').length, 2);
  });

  it('returns empty array for invalid class', () => {
    assert.deepStrictEqual(getSpecializationsForClass('invalid'), []);
  });

  it('returns empty array for null', () => {
    assert.deepStrictEqual(getSpecializationsForClass(null), []);
  });

  it('returns empty array for undefined', () => {
    assert.deepStrictEqual(getSpecializationsForClass(undefined), []);
  });
});

// ============================================================================
// getSpecialization
// ============================================================================

describe('getSpecialization', () => {
  it('returns berserker for (warrior, berserker)', () => {
    assert.strictEqual(getSpecialization('warrior', 'berserker')?.id, 'berserker');
  });

  it('returns guardian for (warrior, guardian)', () => {
    assert.strictEqual(getSpecialization('warrior', 'guardian')?.id, 'guardian');
  });

  it('returns elementalist for (mage, elementalist)', () => {
    assert.strictEqual(getSpecialization('mage', 'elementalist')?.id, 'elementalist');
  });

  it('returns null for invalid class', () => {
    assert.strictEqual(getSpecialization('invalid', 'berserker'), null);
  });

  it('returns null for invalid spec id', () => {
    assert.strictEqual(getSpecialization('warrior', 'invalid'), null);
  });

  it('returns null for null inputs', () => {
    assert.strictEqual(getSpecialization(null, null), null);
  });
});

// ============================================================================
// canSpecialize
// ============================================================================

describe('canSpecialize', () => {
  it('returns true for level 5 player without specialization', () => {
    assert.strictEqual(canSpecialize(clone(baseWarrior)), true);
  });

  it('returns true for level 10 player without specialization', () => {
    const player = { ...clone(baseWarrior), level: 10 };
    assert.strictEqual(canSpecialize(player), true);
  });

  it('returns false for level 4 player', () => {
    const player = { ...clone(baseWarrior), level: 4 };
    assert.strictEqual(canSpecialize(player), false);
  });

  it('returns false for level 1 player', () => {
    const player = { ...clone(baseWarrior), level: 1 };
    assert.strictEqual(canSpecialize(player), false);
  });

  it('returns false for already specialized player', () => {
    const player = { ...clone(baseWarrior), specialization: 'berserker' };
    assert.strictEqual(canSpecialize(player), false);
  });

  it('returns false for null player', () => {
    assert.strictEqual(canSpecialize(null), false);
  });
});

// ============================================================================
// applySpecialization (warrior -> berserker)
// ============================================================================

describe('applySpecialization (warrior -> berserker)', () => {
  it('creates new player object (immutability check)', () => {
    const player = clone(baseWarrior);
    const result = applySpecialization(player, 'berserker');
    assert.notStrictEqual(result, player);
  });

  it("sets specialization to 'berserker'", () => {
    const result = applySpecialization(clone(baseWarrior), 'berserker');
    assert.strictEqual(result.specialization, 'berserker');
  });

  it("sets specializationName to 'Berserker'", () => {
    const result = applySpecialization(clone(baseWarrior), 'berserker');
    assert.strictEqual(result.specializationName, 'Berserker');
  });

  it('increases atk by 4 (from 12 to 16)', () => {
    const result = applySpecialization(clone(baseWarrior), 'berserker');
    assert.strictEqual(result.atk, 16);
  });

  it('increases spd by 2 (from 6 to 8)', () => {
    const result = applySpecialization(clone(baseWarrior), 'berserker');
    assert.strictEqual(result.spd, 8);
  });

  it('decreases def by 2 (from 10 to 8)', () => {
    const result = applySpecialization(clone(baseWarrior), 'berserker');
    assert.strictEqual(result.def, 8);
  });

  it("adds 'frenzy' and 'reckless-strike' to abilities", () => {
    const result = applySpecialization(clone(baseWarrior), 'berserker');
    assert.ok(result.abilities.includes('frenzy'));
    assert.ok(result.abilities.includes('reckless-strike'));
  });

  it('does not duplicate existing abilities', () => {
    const player = { ...clone(baseWarrior), abilities: ['frenzy', 'war-cry'] };
    const result = applySpecialization(player, 'berserker');
    const frenzyCount = result.abilities.filter((ability) => ability === 'frenzy').length;
    assert.strictEqual(frenzyCount, 1);
  });

  it('sets passive to bloodlust object', () => {
    const result = applySpecialization(clone(baseWarrior), 'berserker');
    assert.deepStrictEqual(result.passive, SPECIALIZATIONS.warrior.berserker.passive);
  });
});

// ============================================================================
// applySpecialization (warrior -> guardian)
// ============================================================================

describe('applySpecialization (warrior -> guardian)', () => {
  it('increases def by 5', () => {
    const result = applySpecialization(clone(baseWarrior), 'guardian');
    assert.strictEqual(result.def, 15);
  });

  it('increases maxHp by 15', () => {
    const result = applySpecialization(clone(baseWarrior), 'guardian');
    assert.strictEqual(result.maxHp, 65);
  });

  it('increases hp by 15 (matching maxHp increase)', () => {
    const result = applySpecialization(clone(baseWarrior), 'guardian');
    assert.strictEqual(result.hp, 65);
  });

  it('decreases spd by 1', () => {
    const result = applySpecialization(clone(baseWarrior), 'guardian');
    assert.strictEqual(result.spd, 5);
  });

  it('adds fortress-stance and taunt abilities', () => {
    const result = applySpecialization(clone(baseWarrior), 'guardian');
    assert.ok(result.abilities.includes('fortress-stance'));
    assert.ok(result.abilities.includes('taunt'));
  });
});

// ============================================================================
// applySpecialization (mage -> elementalist with stats object)
// ============================================================================

describe('applySpecialization (mage -> elementalist with stats object)', () => {
  it('works with player.stats nested object', () => {
    const result = applySpecialization(clone(baseMage), 'elementalist');
    assert.ok(result.stats && typeof result.stats === 'object');
  });

  it('increases stats.int by 5', () => {
    const result = applySpecialization(clone(baseMage), 'elementalist');
    assert.strictEqual(result.stats.int, 19);
  });

  it('increases stats.maxMp by 10', () => {
    const result = applySpecialization(clone(baseMage), 'elementalist');
    assert.strictEqual(result.stats.maxMp, 60);
  });

  it('increases stats.mp by 10', () => {
    const result = applySpecialization(clone(baseMage), 'elementalist');
    assert.strictEqual(result.stats.mp, 60);
  });
});

// ============================================================================
// applySpecialization edge cases
// ============================================================================

describe('applySpecialization edge cases', () => {
  it('returns null for null player', () => {
    assert.strictEqual(applySpecialization(null, 'berserker'), null);
  });

  it('returns null for invalid specId', () => {
    assert.strictEqual(applySpecialization(clone(baseWarrior), 'invalid'), null);
  });

  it('returns null for wrong class spec (warrior trying mage spec)', () => {
    assert.strictEqual(applySpecialization(clone(baseWarrior), 'elementalist'), null);
  });

  it('returns null for already specialized player', () => {
    const player = { ...clone(baseWarrior), specialization: 'berserker' };
    assert.strictEqual(applySpecialization(player, 'guardian'), null);
  });

  it('returns null for level 4 player', () => {
    const player = { ...clone(baseWarrior), level: 4 };
    assert.strictEqual(applySpecialization(player, 'berserker'), null);
  });

  it('original player object is not mutated', () => {
    const player = clone(baseWarrior);
    const snapshot = clone(baseWarrior);
    applySpecialization(player, 'berserker');
    assert.deepStrictEqual(player, snapshot);
  });
});

// ============================================================================
// isSpecialized
// ============================================================================

describe('isSpecialized', () => {
  it('returns true for specialized player', () => {
    const player = { ...clone(baseWarrior), specialization: 'berserker' };
    assert.strictEqual(isSpecialized(player), true);
  });

  it('returns false for unspecialized player', () => {
    assert.strictEqual(isSpecialized(clone(baseWarrior)), false);
  });

  it('returns false for null', () => {
    assert.strictEqual(isSpecialized(null), false);
  });
});

// ============================================================================
// getSpecializationInfo
// ============================================================================

describe('getSpecializationInfo', () => {
  it('returns correct info for berserker warrior', () => {
    const player = { ...clone(baseWarrior), specialization: 'berserker' };
    const info = getSpecializationInfo(player);
    assert.deepStrictEqual(info, {
      id: 'berserker',
      name: 'Berserker',
      description: SPECIALIZATIONS.warrior.berserker.description,
      passive: SPECIALIZATIONS.warrior.berserker.passive
    });
  });

  it('returns null for unspecialized player', () => {
    assert.strictEqual(getSpecializationInfo(clone(baseWarrior)), null);
  });

  it('returns null for null', () => {
    assert.strictEqual(getSpecializationInfo(null), null);
  });
});

// ============================================================================
// getSpecializationPassive
// ============================================================================

describe('getSpecializationPassive', () => {
  it('returns bloodlust passive for berserker warrior', () => {
    const player = { ...clone(baseWarrior), specialization: 'berserker' };
    assert.deepStrictEqual(
      getSpecializationPassive(player),
      SPECIALIZATIONS.warrior.berserker.passive
    );
  });

  it('returns null for unspecialized player', () => {
    assert.strictEqual(getSpecializationPassive(clone(baseWarrior)), null);
  });

  it('returns null for null', () => {
    assert.strictEqual(getSpecializationPassive(null), null);
  });
});

// ============================================================================
// getAllSpecializations
// ============================================================================

describe('getAllSpecializations', () => {
  it('returns array of 8 specializations', () => {
    assert.strictEqual(getAllSpecializations().length, 8);
  });

  it('each has required fields (id, name, description)', () => {
    for (const spec of getAllSpecializations()) {
      assert.ok(spec.id, 'Missing id');
      assert.ok(spec.name, 'Missing name');
      assert.ok(spec.description, 'Missing description');
    }
  });
});
