/**
 * Equipment Sets Integration Test — AI Village RPG
 * Tests that equipment sets UI is properly integrated into render.js
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';

test('Equipment Sets Integration', async (t) => {
  const renderPath = path.join(process.cwd(), 'src', 'render.js');
  const renderContent = fs.readFileSync(renderPath, 'utf8');

  await t.test('render.js imports equipment-sets-ui functions', () => {
    assert.ok(
      renderContent.includes("import { renderEquipmentSetsPanel, getEquipmentSetsPanelStyles } from './equipment-sets-ui.js'"),
      'Should import renderEquipmentSetsPanel and getEquipmentSetsPanelStyles'
    );
  });

  await t.test('render.js calls renderEquipmentSetsPanel in inventory phase', () => {
    assert.ok(
      renderContent.includes('renderEquipmentSetsPanel(equipment'),
      'Should call renderEquipmentSetsPanel with equipment'
    );
  });

  await t.test('render.js injects equipment sets panel styles', () => {
    assert.ok(
      renderContent.includes("equipment-sets-panel-styles"),
      'Should have style element ID for equipment sets panel'
    );
    assert.ok(
      renderContent.includes('getEquipmentSetsPanelStyles()'),
      'Should call getEquipmentSetsPanelStyles'
    );
  });

  await t.test('render.js includes Equipment Sets card in inventory HUD', () => {
    assert.ok(
      renderContent.includes('Equipment Sets'),
      'Should have Equipment Sets heading'
    );
    assert.ok(
      renderContent.includes('toggleSetsBtn'),
      'Should have toggle button for equipment sets'
    );
    assert.ok(
      renderContent.includes('equipSetsContainer'),
      'Should have container for equipment sets panel'
    );
  });

  await t.test('render.js has toggle handler for equipment sets visibility', () => {
    assert.ok(
      renderContent.includes("getElementById('toggleSetsBtn')"),
      'Should get toggle button element'
    );
    assert.ok(
      renderContent.includes("getElementById('equipSetsContainer')"),
      'Should get sets container element'
    );
    assert.ok(
      renderContent.includes("style.display === 'none'") || renderContent.includes("display === 'none'"),
      'Should check display state for toggle'
    );
  });
});

console.log('Equipment Sets Integration Tests: Starting...');
