import { test, assert } from './utils.js';
import { createCharacter } from '../src/character-creation.js';
test('createCharacter creates a warrior with correct stats', () => {
  const warrior = createCharacter('Conan', 'warrior');
  assert(warrior.name === 'Conan', 'Character name is incorrect');
  assert(warrior.class === 'warrior', 'Character class is incorrect');
  assert(warrior.level === 1, 'Character level should be 1');
  assert(warrior.stats.strength === 15, 'Warrior strength is incorrect');
  assert(warrior.hp === 120, 'Warrior HP is incorrect');
});
test('createCharacter creates a mage with correct stats', () => {
    const mage = createCharacter('Gandalf', 'mage');
    assert(mage.name === 'Gandalf', 'Character name is incorrect');
    assert(mage.class === 'mage', 'Character class is incorrect');
    assert(mage.level === 1, 'Character level should be 1');
    assert(mage.stats.intelligence === 15, 'Mage intelligence is incorrect');
    assert(mage.mp === 80, 'Mage MP is incorrect');
});
test('createCharacter creates a rogue with correct stats', () => {
    const rogue = createCharacter('Aragorn', 'rogue');
    assert(rogue.name === 'Aragorn', 'Character name is incorrect');
    assert(rogue.class === 'rogue', 'Character class is incorrect');
    assert(rogue.level === 1, 'Character level should be 1');
    assert(rogue.stats.dexterity === 15, 'Rogue dexterity is incorrect');
});

// Tests for appearance customization (added by Opus 4.5 Claude Code)
import { HAIR_COLORS, SKIN_TONES, PORTRAITS, validateAppearance } from '../src/character-creation.js';

test('createCharacter sets default appearance when not provided', () => {
  const char = createCharacter('Test', 'warrior');
  assert(char.appearance !== undefined, 'Character should have appearance property');
  assert(char.appearance.hairColor === 'brown', 'Default hair color should be brown');
  assert(char.appearance.skinTone === 'medium', 'Default skin tone should be medium');
  assert(char.appearance.portrait === 'default', 'Default portrait should be default');
});

test('createCharacter accepts custom appearance options', () => {
  const char = createCharacter('Custom', 'mage', {
    hairColor: 'blue',
    skinTone: 'dark',
    portrait: 'mage_f1'
  });
  assert(char.appearance.hairColor === 'blue', 'Custom hair color should be set');
  assert(char.appearance.skinTone === 'dark', 'Custom skin tone should be set');
  assert(char.appearance.portrait === 'mage_f1', 'Custom portrait should be set');
});

test('HAIR_COLORS contains expected options', () => {
  assert(Array.isArray(HAIR_COLORS), 'HAIR_COLORS should be an array');
  assert(HAIR_COLORS.includes('black'), 'HAIR_COLORS should include black');
  assert(HAIR_COLORS.includes('blonde'), 'HAIR_COLORS should include blonde');
  assert(HAIR_COLORS.length >= 5, 'HAIR_COLORS should have at least 5 options');
});

test('SKIN_TONES contains expected options', () => {
  assert(Array.isArray(SKIN_TONES), 'SKIN_TONES should be an array');
  assert(SKIN_TONES.includes('light'), 'SKIN_TONES should include light');
  assert(SKIN_TONES.includes('dark'), 'SKIN_TONES should include dark');
  assert(SKIN_TONES.length >= 4, 'SKIN_TONES should have at least 4 options');
});

test('PORTRAITS contains expected options', () => {
  assert(Array.isArray(PORTRAITS), 'PORTRAITS should be an array');
  assert(PORTRAITS.includes('default'), 'PORTRAITS should include default');
  assert(PORTRAITS.includes('warrior_m1'), 'PORTRAITS should include warrior_m1');
});

test('validateAppearance returns valid for correct options', () => {
  const result = validateAppearance({
    hairColor: 'black',
    skinTone: 'medium',
    portrait: 'default'
  });
  assert(result.isValid === true, 'Valid options should pass validation');
  assert(result.errors.length === 0, 'Valid options should have no errors');
});

test('validateAppearance returns errors for invalid options', () => {
  const result = validateAppearance({
    hairColor: 'rainbow',
    skinTone: 'invalid',
    portrait: 'nonexistent'
  });
  assert(result.isValid === false, 'Invalid options should fail validation');
  assert(result.errors.length === 3, 'Should have 3 errors for 3 invalid options');
});
