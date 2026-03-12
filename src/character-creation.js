// This file will contain the character creation logic.

// Available appearance options
export const HAIR_COLORS = ['black', 'brown', 'blonde', 'red', 'white', 'blue', 'green', 'purple'];
export const SKIN_TONES = ['light', 'fair', 'medium', 'tan', 'dark', 'deep'];
export const PORTRAITS = ['warrior_m1', 'warrior_f1', 'mage_m1', 'mage_f1', 'rogue_m1', 'rogue_f1', 'default'];

/**
 * Creates a new character object.
 * @param {string} name - The character's name.
 * @param {string} characterClass - The character's class (e.g., 'warrior', 'mage', 'rogue').
 * @param {object} [appearance] - Optional appearance customization.
 * @param {string} [appearance.hairColor] - Hair color from HAIR_COLORS.
 * @param {string} [appearance.skinTone] - Skin tone from SKIN_TONES.
 * @param {string} [appearance.portrait] - Portrait ID from PORTRAITS.
 * @returns {object} The new character object.
 */
export function createCharacter(name, characterClass, appearance = {}) {
  const character = {
    name: name,
    class: characterClass,
    level: 1,
    xp: 0,
    hp: 100,
    mp: 50,
    stats: {
      strength: 10,
      intelligence: 10,
      dexterity: 10,
    },
    appearance: {
      hairColor: appearance.hairColor || 'brown',
      skinTone: appearance.skinTone || 'medium',
      portrait: appearance.portrait || 'default',
    },
    inventory: [],
    equipment: {},
  };

  // Class-specific stat adjustments
  switch (characterClass) {
    case 'warrior':
      character.stats.strength += 5;
      character.hp += 20;
      break;
    case 'mage':
      character.stats.intelligence += 5;
      character.mp += 30;
      break;
    case 'rogue':
      character.stats.dexterity += 5;
      break;
  }

  return character;
}

/**
 * Validates appearance options.
 * @param {object} appearance - The appearance object to validate.
 * @returns {object} Object with isValid boolean and errors array.
 */
export function validateAppearance(appearance) {
  const errors = [];

  if (appearance.hairColor && !HAIR_COLORS.includes(appearance.hairColor)) {
    errors.push(`Invalid hair color: ${appearance.hairColor}. Valid options: ${HAIR_COLORS.join(', ')}`);
  }

  if (appearance.skinTone && !SKIN_TONES.includes(appearance.skinTone)) {
    errors.push(`Invalid skin tone: ${appearance.skinTone}. Valid options: ${SKIN_TONES.join(', ')}`);
  }

  if (appearance.portrait && !PORTRAITS.includes(appearance.portrait)) {
    errors.push(`Invalid portrait: ${appearance.portrait}. Valid options: ${PORTRAITS.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
  };
}
