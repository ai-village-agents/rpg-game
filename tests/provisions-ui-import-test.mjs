// Import test for provisions-ui.js
// Verifies the module loads in Node without DOM dependencies (lazy DOM access)

import assert from 'node:assert';
import {
  renderProvisionBuffs,
  renderProvisionsPanel,
  attachProvisionsHandlers,
  getProvisionsStyles,
} from '../src/provisions-ui.js';

// 1. Exports exist
assert.strictEqual(typeof renderProvisionBuffs, 'function', 'renderProvisionBuffs should be a function');
assert.strictEqual(typeof renderProvisionsPanel, 'function', 'renderProvisionsPanel should be a function');
assert.strictEqual(typeof attachProvisionsHandlers, 'function', 'attachProvisionsHandlers should be a function');
assert.strictEqual(typeof getProvisionsStyles, 'function', 'getProvisionsStyles should be a function');

// 2. renderProvisionBuffs with no buffs returns empty string
const emptyBuffs = renderProvisionBuffs({});
assert.strictEqual(emptyBuffs, '', 'Should return empty string when no buffs');

// 3. renderProvisionBuffs with null state returns empty string
const nullBuffs = renderProvisionBuffs(null);
assert.strictEqual(nullBuffs, '', 'Should return empty string for null state');

// 4. renderProvisionBuffs with active buffs returns HTML
const stateWithBuffs = {
  provisionState: {
    activeBuffs: [
      { id: 'heartyStew', name: 'Hearty Stew', turnsRemaining: 3, atkBoost: 3, defBoost: 2, hpRegen: 0, mpRegen: 0 },
    ],
  },
};
const buffsHtml = renderProvisionBuffs(stateWithBuffs);
assert.ok(buffsHtml.includes('Hearty Stew'), 'Should include buff name');
assert.ok(buffsHtml.includes('3t'), 'Should include turns remaining');
assert.ok(buffsHtml.includes('provision-buffs-bar'), 'Should have buffs bar class');
assert.ok(buffsHtml.includes('+3 ATK'), 'Should show ATK bonus in summary');
assert.ok(buffsHtml.includes('+2 DEF'), 'Should show DEF bonus in summary');

// 5. renderProvisionsPanel with minimal state
const panelState = {
  phase: 'provisions',
  player: { level: 1, hp: 50, maxHp: 50, mp: 15, maxMp: 15, inventory: [] },
  provisionsUI: { tab: 'use', selectedProvision: null, message: null },
  log: [],
};
const panelHtml = renderProvisionsPanel(panelState);
assert.ok(panelHtml.includes('Provisions'), 'Should include title');
assert.ok(panelHtml.includes('provisions-panel'), 'Should have panel class');
assert.ok(panelHtml.includes('btnCloseProvisions'), 'Should have close button');
assert.ok(panelHtml.includes('no provisions'), 'Should show empty message when no provisions');

// 6. renderProvisionsPanel with provisions in inventory
const panelWithItems = {
  ...panelState,
  player: {
    ...panelState.player,
    inventory: [
      { id: 'travelerBread', name: "Traveler's Bread", type: 'provision', quantity: 3 },
      { id: 'herbTea', name: 'Herb Tea', type: 'provision', quantity: 1 },
    ],
  },
};
const itemsHtml = renderProvisionsPanel(panelWithItems);
assert.ok(itemsHtml.includes("Traveler&#39;s Bread") || itemsHtml.includes("Traveler's Bread"), 'Should include bread name');
assert.ok(itemsHtml.includes('Herb Tea'), 'Should include tea name');
assert.ok(itemsHtml.includes('x3'), 'Should show quantity');

// 7. renderProvisionsPanel cook tab
const cookState = {
  ...panelState,
  provisionsUI: { tab: 'cook', selectedProvision: null, message: null },
  player: { ...panelState.player, level: 5 },
};
const cookHtml = renderProvisionsPanel(cookState);
assert.ok(cookHtml.includes('Cook Hearty Stew') || cookHtml.includes('cookHeartyStew'), 'Should include cooking recipe');
assert.ok(cookHtml.includes('recipe-card'), 'Should have recipe card class');

// 8. renderProvisionsPanel buffs tab
const buffsTabState = {
  ...panelState,
  provisionsUI: { tab: 'buffs', selectedProvision: null, message: null },
  provisionState: {
    activeBuffs: [
      { id: 'dragonPepper', name: 'Dragon Pepper Soup', turnsRemaining: 5, atkBoost: 5, defBoost: 0, hpRegen: 0, mpRegen: 0 },
    ],
  },
};
const buffsTabHtml = renderProvisionsPanel(buffsTabState);
assert.ok(buffsTabHtml.includes('Dragon Pepper Soup'), 'Should include buff name');
assert.ok(buffsTabHtml.includes('5 turns left'), 'Should show turns remaining');
assert.ok(buffsTabHtml.includes('+5 ATK'), 'Should show ATK effect');

// 9. renderProvisionsPanel message display
const messageState = {
  ...panelState,
  provisionsUI: { tab: 'use', selectedProvision: null, message: 'Used Herb Tea.' },
};
const messageHtml = renderProvisionsPanel(messageState);
assert.ok(messageHtml.includes('Used Herb Tea.'), 'Should display message');
assert.ok(messageHtml.includes('provisions-message'), 'Should have message class');

// 10. renderProvisionsPanel selected provision
const selectedState = {
  ...panelWithItems,
  provisionsUI: { tab: 'use', selectedProvision: 'travelerBread', message: null },
};
const selectedHtml = renderProvisionsPanel(selectedState);
assert.ok(selectedHtml.includes('selected'), 'Should have selected class');
assert.ok(selectedHtml.includes('Consume'), 'Should show Consume button for selected provision');

// 11. getProvisionsStyles returns CSS string
const styles = getProvisionsStyles();
assert.ok(typeof styles === 'string', 'Should return string');
assert.ok(styles.includes('.provisions-panel'), 'Should include panel style');
assert.ok(styles.includes('.provision-item'), 'Should include item style');
assert.ok(styles.includes('.recipe-card'), 'Should include recipe card style');
assert.ok(styles.includes('.buff-card'), 'Should include buff card style');
assert.ok(styles.includes('.provision-buffs-bar'), 'Should include buffs bar style');

// 12. attachProvisionsHandlers works without document (no-op in Node)
attachProvisionsHandlers(() => {});

// 13. XSS safety: HTML-escaped output
const xssState = {
  ...panelState,
  provisionsUI: { tab: 'use', selectedProvision: null, message: '<script>alert("xss")</script>' },
};
const xssHtml = renderProvisionsPanel(xssState);
assert.ok(!xssHtml.includes('<script>'), 'Should escape script tags');
assert.ok(xssHtml.includes('&lt;script&gt;'), 'Should HTML-encode angle brackets');

// 14. renderProvisionBuffs with multiple buffs shows combined summary
const multiBuffState = {
  provisionState: {
    activeBuffs: [
      { id: 'heartyStew', name: 'Hearty Stew', turnsRemaining: 3, atkBoost: 3, defBoost: 2, hpRegen: 0, mpRegen: 0 },
      { id: 'dragonPepper', name: 'Dragon Pepper Soup', turnsRemaining: 5, atkBoost: 5, defBoost: 0, hpRegen: 0, mpRegen: 0 },
    ],
  },
};
const multiHtml = renderProvisionBuffs(multiBuffState);
assert.ok(multiHtml.includes('+8 ATK'), 'Should show combined ATK bonus (3+5)');
assert.ok(multiHtml.includes('+2 DEF'), 'Should show combined DEF bonus');
assert.ok(multiHtml.includes('Hearty Stew'), 'Should list first buff');
assert.ok(multiHtml.includes('Dragon Pepper Soup'), 'Should list second buff');

// 15. Rarity colors appear in output
const rarityState = {
  ...panelState,
  player: {
    ...panelState.player,
    inventory: [
      { id: 'dragonPepper', name: 'Dragon Pepper Soup', type: 'provision', quantity: 1 },
    ],
  },
};
const rarityHtml = renderProvisionsPanel(rarityState);
assert.ok(rarityHtml.includes('#3498db'), 'Should include Rare color');
assert.ok(rarityHtml.includes('[Rare]'), 'Should show rarity label');

console.log('provisions-ui-import-test: All 15 tests passed ✅');
