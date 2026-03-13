/**
 * Tests for Combat Visual Effects System
 */
import { strict as assert } from 'node:assert';
import { describe, it, beforeEach } from 'node:test';

// Node environment — no DOM, so all functions should gracefully no-op
import {
  initVisualEffects,
  screenShake,
  flashScreen,
  spawnParticles,
  playCombatEffect,
  spawnSparkles
} from '../src/combat-visual-effects.js';

describe('Combat Visual Effects (Node/no-DOM)', () => {
  it('initVisualEffects does not throw without DOM', () => {
    assert.doesNotThrow(() => initVisualEffects());
  });

  it('screenShake does not throw without DOM', () => {
    assert.doesNotThrow(() => screenShake('small', 200));
    assert.doesNotThrow(() => screenShake('large', 300));
  });

  it('flashScreen does not throw without DOM', () => {
    assert.doesNotThrow(() => flashScreen('rgba(255,0,0,0.2)', 100));
  });

  it('spawnParticles does not throw without DOM', () => {
    assert.doesNotThrow(() => spawnParticles({ target: 'enemy', type: 'hit', count: 5 }));
    assert.doesNotThrow(() => spawnParticles({ target: 'player', type: 'heal', count: 3 }));
  });

  it('playCombatEffect does not throw for any action type', () => {
    const actions = ['attack', 'critical', 'heal', 'block', 'miss', 'elementalAttack', 'unknown'];
    for (const action of actions) {
      assert.doesNotThrow(() => playCombatEffect({ action, target: 'enemy' }));
    }
  });

  it('playCombatEffect handles elemental attacks', () => {
    const elements = ['fire', 'ice', 'lightning', 'holy', 'shadow', 'nature', null];
    for (const element of elements) {
      assert.doesNotThrow(() => playCombatEffect({ action: 'elementalAttack', target: 'enemy', element }));
    }
  });

  it('spawnSparkles does not throw without DOM', () => {
    assert.doesNotThrow(() => spawnSparkles({ x: 100, y: 200, count: 6 }));
    assert.doesNotThrow(() => spawnSparkles({ x: 0, y: 0, count: 0, color: '#fff' }));
  });

  it('all exports are functions', () => {
    assert.equal(typeof initVisualEffects, 'function');
    assert.equal(typeof screenShake, 'function');
    assert.equal(typeof flashScreen, 'function');
    assert.equal(typeof spawnParticles, 'function');
    assert.equal(typeof playCombatEffect, 'function');
    assert.equal(typeof spawnSparkles, 'function');
  });

  it('screenShake accepts default parameters', () => {
    assert.doesNotThrow(() => screenShake());
  });

  it('flashScreen accepts default parameters', () => {
    assert.doesNotThrow(() => flashScreen());
  });

  it('spawnParticles accepts minimal options', () => {
    assert.doesNotThrow(() => spawnParticles({}));
  });

  it('playCombatEffect accepts minimal options', () => {
    assert.doesNotThrow(() => playCombatEffect({ action: 'attack' }));
  });
});
