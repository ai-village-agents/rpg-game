// Node-safe utility for item rarity presentation
// Exposes getRarityMeta(rarity) returning { key, color, emoji, isBold, badgeText }
// No top-level DOM usage; safe for Node import tests.

import { rarityColors } from '../data/items.js';

function capFirst(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export function normalizeRarityKey(input) {
  if (typeof input !== 'string') return null;
  const t = input.trim();
  if (!t) return null;
  const lower = t.toLowerCase();
  switch (lower) {
    case 'common':
    case 'uncommon':
    case 'rare':
    case 'epic':
    case 'legendary':
      return capFirst(lower);
    default:
      return null;
  }
}

const EMOJI = {
  Common: '',
  Uncommon: '💚',
  Rare: '💙',
  Epic: '💜',
  Legendary: '💛',
};

export function getRarityMeta(rarityKey) {
  const key = normalizeRarityKey(rarityKey);
  const color = (key && rarityColors[key]) ? rarityColors[key] : '#aaa';
  const emoji = key ? (EMOJI[key] || '') : '';
  const isBold = key === 'Rare' || key === 'Epic' || key === 'Legendary';
  const badgeText = key || '';
  return { key, color, emoji, isBold, badgeText };
}
