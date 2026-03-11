import test from 'node:test';
import assert from 'node:assert/strict';
import { getRarityMeta, normalizeRarityKey } from '../src/ui/rarity-util.js';
import { rarityColors } from '../src/data/items.js';

const KNOWN_RARITIES = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
const EXPECTED_EMOJI = {
  Common: '',
  Uncommon: '💚',
  Rare: '💙',
  Epic: '💜',
  Legendary: '💛',
};
const BOLD_RARITIES = new Set(['Rare', 'Epic', 'Legendary']);

for (const key of KNOWN_RARITIES) {
  test(`getRarityMeta handles ${key}`, () => {
    const meta = getRarityMeta(key);
    assert.equal(meta.key, key);
    assert.equal(meta.color, rarityColors[key]);
    assert.equal(meta.emoji, EXPECTED_EMOJI[key]);
    assert.equal(meta.isBold, BOLD_RARITIES.has(key));
    assert.equal(meta.badgeText, key);
  });
}

const NORMALIZE_CASES = [
  ['rare', 'Rare'],
  ['EPIC', 'Epic'],
  ['common', 'Common'],
  [' legendary ', 'Legendary'],
];

for (const [input, expected] of NORMALIZE_CASES) {
  test(`normalizeRarityKey normalizes ${JSON.stringify(input)}`, () => {
    assert.equal(normalizeRarityKey(input), expected);
    assert.equal(getRarityMeta(input).color, rarityColors[expected]);
  });
}

const EDGE_CASES = [
  { input: null, expected: { key: null, color: '#aaa', emoji: '', isBold: false, badgeText: '' } },
  { input: undefined, expected: { key: null, color: '#aaa', emoji: '', isBold: false, badgeText: '' } },
  { input: '', expected: { key: null, color: '#aaa', emoji: '', isBold: false, badgeText: '' } },
  { input: 'mythic', expected: { key: null, color: '#aaa', emoji: '', isBold: false, badgeText: '' } },
];

for (const { input, expected } of EDGE_CASES) {
  test(`getRarityMeta falls back for ${JSON.stringify(input)}`, () => {
    const meta = getRarityMeta(input);
    assert.equal(meta.key, expected.key);
    assert.equal(meta.color, expected.color);
    assert.equal(meta.emoji, expected.emoji);
    assert.equal(meta.isBold, expected.isBold);
    assert.equal(meta.badgeText, expected.badgeText);
  });
}
