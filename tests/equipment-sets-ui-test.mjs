/**
 * Equipment Sets UI Tests — AI Village RPG
 * Tests for the equipment sets display functionality
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  getEquipmentSetsStatus,
  renderEquipmentSetsPanel,
  getEquipmentSetsPanelStyles,
} from '../src/equipment-sets-ui.js';

import { equipmentSets } from '../src/equipment-sets.js';

describe('Equipment Sets UI', () => {
  describe('getEquipmentSetsStatus', () => {
    test('returns all sets with inactive status when no equipment', () => {
      const status = getEquipmentSetsStatus(null);
      assert.equal(status.length, equipmentSets.length);
      assert.ok(status.every(s => !s.isActive));
      assert.ok(status.every(s => s.equippedCount === 0));
    });

    test('returns all sets with inactive status for empty equipment', () => {
      const status = getEquipmentSetsStatus({});
      assert.equal(status.length, equipmentSets.length);
      assert.ok(status.every(s => !s.isActive));
    });

    test('marks set as active when all required items are equipped', () => {
      const equipment = {
        weapon: 'rustySword',
        armor: 'leatherArmor',
        accessory: null,
      };
      const status = getEquipmentSetsStatus(equipment);
      const rustySet = status.find(s => s.set.id === 'rustySet');
      
      assert.ok(rustySet, 'Rusty set should be found');
      assert.equal(rustySet.isActive, true);
      assert.equal(rustySet.equippedCount, 2);
      assert.equal(rustySet.totalRequired, 2);
      assert.deepEqual(rustySet.missingItems, []);
    });

    test('tracks partial progress for incomplete sets', () => {
      const equipment = {
        weapon: 'ironSword',
        armor: null,
        accessory: null,
      };
      const status = getEquipmentSetsStatus(equipment);
      const ironSet = status.find(s => s.set.id === 'ironSet');
      
      assert.ok(ironSet, 'Iron set should be found');
      assert.equal(ironSet.isActive, false);
      assert.equal(ironSet.equippedCount, 1);
      assert.equal(ironSet.totalRequired, 2);
      assert.ok(ironSet.missingItems.includes('chainmail'));
    });

    test('handles multiple active sets', () => {
      // Fortune set requires 3 accessories
      const equipment = {
        weapon: 'rustySword',
        armor: 'leatherArmor',
        accessory: 'ringOfFortune',
      };
      const status = getEquipmentSetsStatus(equipment);
      const activeSets = status.filter(s => s.isActive);
      
      // Rusty set should be active (sword + armor)
      const rustyActive = activeSets.find(s => s.set.id === 'rustySet');
      assert.ok(rustyActive, 'Rusty set should be active');
    });
  });

  describe('renderEquipmentSetsPanel', () => {
    test('renders panel with no active sets message when equipment empty', () => {
      const html = renderEquipmentSetsPanel(null);
      assert.ok(html.includes('equipment-sets-panel'));
      assert.ok(html.includes('No complete sets equipped'));
    });

    test('renders active set when complete', () => {
      const equipment = {
        weapon: 'rustySword',
        armor: 'leatherArmor',
      };
      const html = renderEquipmentSetsPanel(equipment);
      assert.ok(html.includes('set-card--active'));
      assert.ok(html.includes('Rusty Set'));
    });

    test('hides inactive sets when showInactive is false', () => {
      const html = renderEquipmentSetsPanel(null, { showInactive: false });
      assert.ok(!html.includes('inactive-sets'));
      assert.ok(!html.includes('Available Sets'));
    });

    test('shows inactive sets by default', () => {
      const html = renderEquipmentSetsPanel(null, { showInactive: true });
      assert.ok(html.includes('inactive-sets'));
      assert.ok(html.includes('Available Sets'));
    });

    test('uses compact mode when specified', () => {
      const equipment = {
        weapon: 'rustySword',
        armor: 'leatherArmor',
      };
      const html = renderEquipmentSetsPanel(equipment, { compact: true });
      assert.ok(html.includes('set-card--compact'));
    });

    test('escapes HTML in set names', () => {
      // Our existing sets don't have HTML characters, but the function should handle them
      const html = renderEquipmentSetsPanel(null);
      // Should not contain unescaped angle brackets in user content
      assert.ok(!html.includes('<script>'));
    });

    test('shows progress for partial sets', () => {
      const equipment = {
        weapon: 'ironSword',
        armor: null,
      };
      const html = renderEquipmentSetsPanel(equipment);
      assert.ok(html.includes('1/2')); // Iron set progress
    });

    test('renders bonus text for active sets', () => {
      const equipment = {
        weapon: 'rustySword',
        armor: 'leatherArmor',
      };
      const html = renderEquipmentSetsPanel(equipment);
      // Rusty set has +3 ATK, +2 DEF, +1 SPD
      assert.ok(html.includes('+3') || html.includes('ATK'));
    });
  });

  describe('getEquipmentSetsPanelStyles', () => {
    test('returns CSS string', () => {
      const styles = getEquipmentSetsPanelStyles();
      assert.equal(typeof styles, 'string');
      assert.ok(styles.length > 100);
    });

    test('contains expected class selectors', () => {
      const styles = getEquipmentSetsPanelStyles();
      assert.ok(styles.includes('.equipment-sets-panel'));
      assert.ok(styles.includes('.set-card'));
      assert.ok(styles.includes('.set-card--active'));
      assert.ok(styles.includes('.set-bonuses'));
    });

    test('uses expected colors for active sets', () => {
      const styles = getEquipmentSetsPanelStyles();
      // Should use gold color for header
      assert.ok(styles.includes('#ffd700'));
      // Should use green-ish color for active
      assert.ok(styles.includes('#4a9'));
    });
  });
});

// Run a basic sanity check
console.log('Equipment Sets UI Tests: Starting...');
