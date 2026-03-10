/**
 * Tests for specialization-ui.js — Pure functions for specialization choice UI.
 * Tests formatAbilityName, shouldShowSpecialization, getSpecializationChoices,
 * createSpecializationState, and the integration with ui-handler.js for
 * CHOOSE_SPECIALIZATION action.
 */

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

import {
  formatAbilityName,
  shouldShowSpecialization,
  getSpecializationChoices,
  createSpecializationState,
} from '../src/specialization-ui.js';

import { SPECIALIZATION_LEVEL, applySpecialization } from '../src/class-specializations.js';

// ─── formatAbilityName ───────────────────────────────────────────

describe('formatAbilityName', () => {
  it('converts single word to Title Case', () => {
    assert.equal(formatAbilityName('frenzy'), 'Frenzy');
  });

  it('converts kebab-case to Title Case words', () => {
    assert.equal(formatAbilityName('reckless-strike'), 'Reckless Strike');
  });

  it('handles multi-part kebab-case', () => {
    assert.equal(formatAbilityName('chain-lightning'), 'Chain Lightning');
  });

  it('returns empty string for null/undefined', () => {
    assert.equal(formatAbilityName(null), '');
    assert.equal(formatAbilityName(undefined), '');
  });

  it('returns empty string for empty string', () => {
    assert.equal(formatAbilityName(''), '');
  });

  it('handles already capitalized input', () => {
    assert.equal(formatAbilityName('Frenzy'), 'Frenzy');
  });
});

// ─── shouldShowSpecialization ────────────────────────────────────

describe('shouldShowSpecialization', () => {
  it('returns true when player is at specialization level with classId and no specialization', () => {
    const player = { level: SPECIALIZATION_LEVEL, classId: 'warrior', specialization: null };
    assert.equal(shouldShowSpecialization(player), true);
  });

  it('returns true when player is above specialization level', () => {
    const player = { level: SPECIALIZATION_LEVEL + 3, classId: 'mage', specialization: undefined };
    assert.equal(shouldShowSpecialization(player), true);
  });

  it('returns false when player is below specialization level', () => {
    const player = { level: SPECIALIZATION_LEVEL - 1, classId: 'warrior' };
    assert.equal(shouldShowSpecialization(player), false);
  });

  it('returns false when player already has a specialization', () => {
    const player = { level: SPECIALIZATION_LEVEL, classId: 'warrior', specialization: 'berserker' };
    assert.equal(shouldShowSpecialization(player), false);
  });

  it('returns false when player has no classId', () => {
    const player = { level: SPECIALIZATION_LEVEL };
    assert.equal(shouldShowSpecialization(player), false);
  });

  it('returns false for null player', () => {
    assert.equal(shouldShowSpecialization(null), false);
  });

  it('returns false for undefined player', () => {
    assert.equal(shouldShowSpecialization(undefined), false);
  });

  it('returns false when level is missing (defaults to 0)', () => {
    const player = { classId: 'rogue' };
    assert.equal(shouldShowSpecialization(player), false);
  });
});

// ─── getSpecializationChoices ────────────────────────────────────

describe('getSpecializationChoices', () => {
  it('returns two choices for warrior class', () => {
    const choices = getSpecializationChoices('warrior');
    assert.equal(choices.length, 2);
    const ids = choices.map(c => c.id);
    assert.ok(ids.includes('berserker'), 'Should include berserker');
    assert.ok(ids.includes('guardian'), 'Should include guardian');
  });

  it('returns two choices for mage class', () => {
    const choices = getSpecializationChoices('mage');
    assert.equal(choices.length, 2);
    const ids = choices.map(c => c.id);
    assert.ok(ids.includes('elementalist'));
    assert.ok(ids.includes('enchanter'));
  });

  it('returns two choices for rogue class', () => {
    const choices = getSpecializationChoices('rogue');
    assert.equal(choices.length, 2);
    const ids = choices.map(c => c.id);
    assert.ok(ids.includes('assassin'));
    assert.ok(ids.includes('shadow'));
  });

  it('returns two choices for cleric class', () => {
    const choices = getSpecializationChoices('cleric');
    assert.equal(choices.length, 2);
    const ids = choices.map(c => c.id);
    assert.ok(ids.includes('paladin'));
    assert.ok(ids.includes('oracle'));
  });

  it('returns empty array for unknown class', () => {
    const choices = getSpecializationChoices('necromancer');
    assert.equal(choices.length, 0);
  });

  it('each choice has required fields', () => {
    const choices = getSpecializationChoices('warrior');
    for (const choice of choices) {
      assert.ok(typeof choice.id === 'string', 'id should be string');
      assert.ok(typeof choice.name === 'string', 'name should be string');
      assert.ok(typeof choice.description === 'string', 'description should be string');
      assert.ok(Array.isArray(choice.statBonuses), 'statBonuses should be array');
      assert.ok(Array.isArray(choice.abilities), 'abilities should be array');
      assert.ok(choice.passive !== undefined, 'passive should exist');
    }
  });

  it('stat bonuses have formatted field with sign prefix', () => {
    const choices = getSpecializationChoices('warrior');
    const berserker = choices.find(c => c.id === 'berserker');
    assert.ok(berserker, 'berserker should exist');
    // berserker has atk: 4 (positive) and def: -2 (negative)
    const atkBonus = berserker.statBonuses.find(sb => sb.stat === 'atk');
    assert.ok(atkBonus, 'atk bonus should exist');
    assert.ok(atkBonus.formatted.startsWith('+'), 'positive stat should start with +');
    assert.ok(atkBonus.value > 0, 'atk value should be positive');

    const defBonus = berserker.statBonuses.find(sb => sb.stat === 'def');
    assert.ok(defBonus, 'def bonus should exist');
    assert.ok(defBonus.value < 0, 'def value should be negative');
    assert.ok(!defBonus.formatted.startsWith('+'), 'negative stat should not start with +');
  });

  it('abilities have id and formatted name', () => {
    const choices = getSpecializationChoices('warrior');
    const berserker = choices.find(c => c.id === 'berserker');
    assert.ok(berserker.abilities.length >= 2, 'berserker should have at least 2 abilities');
    for (const ability of berserker.abilities) {
      assert.ok(typeof ability.id === 'string', 'ability id should be string');
      assert.ok(typeof ability.name === 'string', 'ability name should be string');
      // Name should be Title Case (first letter uppercase)
      assert.ok(ability.name.charAt(0) === ability.name.charAt(0).toUpperCase(),
        'ability name should start with uppercase');
    }
  });

  it('passive has id, name, and description', () => {
    const choices = getSpecializationChoices('mage');
    const elementalist = choices.find(c => c.id === 'elementalist');
    assert.ok(elementalist.passive, 'elementalist should have a passive');
    assert.ok(typeof elementalist.passive.id === 'string');
    assert.ok(typeof elementalist.passive.name === 'string');
    assert.ok(typeof elementalist.passive.description === 'string');
  });
});

// ─── createSpecializationState ───────────────────────────────────

describe('createSpecializationState', () => {
  it('creates state with classId, choices, and playerName', () => {
    const player = { classId: 'warrior', name: 'TestHero', level: 5 };
    const state = createSpecializationState(player);
    assert.equal(state.classId, 'warrior');
    assert.equal(state.playerName, 'TestHero');
    assert.equal(state.choices.length, 2);
  });

  it('handles null player gracefully', () => {
    const state = createSpecializationState(null);
    assert.equal(state.classId, null);
    assert.equal(state.playerName, null);
    assert.equal(state.choices.length, 0);
  });

  it('handles player without classId', () => {
    const player = { name: 'NoClass', level: 5 };
    const state = createSpecializationState(player);
    assert.equal(state.classId, null);
    assert.equal(state.choices.length, 0);
  });

  it('creates correct choices for each class', () => {
    for (const classId of ['warrior', 'mage', 'rogue', 'cleric']) {
      const player = { classId, name: 'Hero', level: 5 };
      const state = createSpecializationState(player);
      assert.equal(state.classId, classId);
      assert.equal(state.choices.length, 2, `${classId} should have 2 choices`);
    }
  });
});

// ─── Integration: applySpecialization with UI flow ───────────────

describe('Specialization UI integration with applySpecialization', () => {
  it('applying berserker specialization modifies player stats correctly', () => {
    const player = {
      classId: 'warrior',
      class: 'warrior',
      name: 'TestWarrior',
      level: 5,
      stats: { maxHp: 80, maxMp: 20, atk: 15, def: 12, spd: 8, int: 5, lck: 5 },
      specialization: null,
      abilities: ['power-strike'],
    };
    const result = applySpecialization(player, 'berserker');
    assert.ok(result, 'applySpecialization should return a result');
    assert.equal(result.specialization, 'berserker');
    // Berserker: atk +4, spd +2, def -2
    assert.equal(result.stats.atk, 19); // 15 + 4
    assert.equal(result.stats.spd, 10); // 8 + 2
    assert.equal(result.stats.def, 10); // 12 - 2
  });

  it('applying guardian specialization modifies player stats correctly', () => {
    const player = {
      classId: 'warrior',
      class: 'warrior',
      name: 'TestWarrior',
      level: 5,
      stats: { maxHp: 80, maxMp: 20, atk: 15, def: 12, spd: 8, int: 5, lck: 5 },
      specialization: null,
      abilities: ['power-strike'],
    };
    const result = applySpecialization(player, 'guardian');
    assert.ok(result);
    assert.equal(result.specialization, 'guardian');
    // Guardian: def +5, maxHp +15, spd -1
    assert.equal(result.stats.def, 17); // 12 + 5
    assert.equal(result.stats.maxHp, 95); // 80 + 15
    assert.equal(result.stats.spd, 7); // 8 - 1
  });

  it('shouldShowSpecialization returns false after applying specialization', () => {
    const player = {
      classId: 'warrior',
      class: 'warrior',
      name: 'TestWarrior',
      level: 5,
      stats: { maxHp: 80, maxMp: 20, atk: 15, def: 12, spd: 8, int: 5, lck: 5 },
      specialization: null,
      abilities: ['power-strike'],
    };
    assert.equal(shouldShowSpecialization(player), true);
    const result = applySpecialization(player, 'berserker');
    assert.equal(shouldShowSpecialization(result), false);
  });

  it('full flow: create state, get choices, verify structure, apply', () => {
    const player = {
      classId: 'rogue',
      class: 'rogue',
      name: 'TestRogue',
      level: 5,
      stats: { maxHp: 60, maxMp: 30, atk: 12, def: 8, spd: 14, int: 7, lck: 10 },
      specialization: null,
      abilities: ['backstab'],
    };
    
    // Step 1: Check should show
    assert.equal(shouldShowSpecialization(player), true);
    
    // Step 2: Create state
    const specState = createSpecializationState(player);
    assert.equal(specState.choices.length, 2);
    
    // Step 3: Find assassin choice
    const assassin = specState.choices.find(c => c.id === 'assassin');
    assert.ok(assassin, 'assassin choice should exist');
    assert.ok(assassin.statBonuses.length > 0, 'should have stat bonuses');
    assert.ok(assassin.abilities.length >= 2, 'should have abilities');
    assert.ok(assassin.passive, 'should have passive');
    
    // Step 4: Apply
    const result = applySpecialization(player, 'assassin');
    assert.equal(result.specialization, 'assassin');
    assert.equal(shouldShowSpecialization(result), false);
  });
});
