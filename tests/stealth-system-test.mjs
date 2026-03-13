/**
 * Stealth System Tests
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

import {
  STEALTH_STATES,
  DETECTION_TYPES,
  COVER_LEVELS,
  NOISE_LEVELS,
  LIGHT_LEVELS,
  AMBUSH_BONUSES,
  initStealthState,
  enterStealth,
  exitStealth,
  setCover,
  setNoiseLevel,
  setLightLevel,
  calculateDetection,
  performDetectionCheck,
  calculateAmbushBonus,
  performAmbush,
  increaseSuspicion,
  decreaseSuspicion,
  getStealthStatus,
  getStealthStats,
  canEnterStealth
} from '../src/stealth-system.js';

import {
  renderStealthPanel,
  renderStealthActive,
  renderStealthInactive,
  renderSuspicionMeter,
  renderEnvironment,
  renderCoverSelector,
  renderLightSelector,
  renderDetectionPreview,
  renderAmbushPreview,
  renderAmbushTypes,
  renderStealthStates,
  renderDetectionTypes,
  renderStealthStats,
  renderCompactStealth,
  renderAlertNotification,
  renderNoiseIndicator
} from '../src/stealth-system-ui.js';

describe('Stealth System', () => {
  let state;

  beforeEach(() => {
    state = {};
    const result = initStealthState(state);
    state = result.state;
  });

  describe('STEALTH_STATES', () => {
    it('has all states', () => {
      assert.ok(STEALTH_STATES.VISIBLE);
      assert.ok(STEALTH_STATES.CONCEALED);
      assert.ok(STEALTH_STATES.HIDDEN);
      assert.ok(STEALTH_STATES.INVISIBLE);
    });

    it('states have detection mod', () => {
      Object.values(STEALTH_STATES).forEach(s => {
        assert.ok(typeof s.detectionMod === 'number');
      });
    });
  });

  describe('DETECTION_TYPES', () => {
    it('has detection types', () => {
      assert.ok(DETECTION_TYPES.SIGHT);
      assert.ok(DETECTION_TYPES.SOUND);
      assert.ok(DETECTION_TYPES.SMELL);
    });
  });

  describe('COVER_LEVELS', () => {
    it('has cover levels', () => {
      assert.ok(COVER_LEVELS.NONE);
      assert.ok(COVER_LEVELS.LIGHT);
      assert.ok(COVER_LEVELS.HEAVY);
      assert.ok(COVER_LEVELS.FULL);
    });
  });

  describe('NOISE_LEVELS', () => {
    it('has noise levels', () => {
      assert.ok(NOISE_LEVELS.SILENT);
      assert.ok(NOISE_LEVELS.NORMAL);
      assert.ok(NOISE_LEVELS.LOUD);
    });
  });

  describe('LIGHT_LEVELS', () => {
    it('has light levels', () => {
      assert.ok(LIGHT_LEVELS.DARKNESS);
      assert.ok(LIGHT_LEVELS.NORMAL);
      assert.ok(LIGHT_LEVELS.BRIGHT);
    });
  });

  describe('initStealthState', () => {
    it('creates initial state', () => {
      const result = initStealthState({});
      assert.ok(result.success);
      assert.ok(!result.state.stealth.isStealthed);
    });
  });

  describe('enterStealth', () => {
    it('enters stealth mode', () => {
      const result = enterStealth(state, 50);
      assert.ok(result.success);
      assert.ok(result.state.stealth.isStealthed);
    });

    it('calculates stealth level', () => {
      const result = enterStealth(state, 50);
      assert.ok(typeof result.stealthLevel === 'number');
    });

    it('fails if already stealthed', () => {
      let result = enterStealth(state, 50);
      state = result.state;
      
      result = enterStealth(state, 50);
      assert.ok(!result.success);
    });

    it('applies cover bonus', () => {
      let result = setCover(state, 'heavy');
      state = result.state;
      
      result = enterStealth(state, 50);
      assert.ok(result.stealthLevel > 50);
    });
  });

  describe('exitStealth', () => {
    it('exits stealth mode', () => {
      let result = enterStealth(state, 50);
      state = result.state;
      
      result = exitStealth(state);
      assert.ok(result.success);
      assert.ok(!result.state.stealth.isStealthed);
    });

    it('resets stealth level', () => {
      let result = enterStealth(state, 50);
      state = result.state;
      
      result = exitStealth(state);
      assert.strictEqual(result.state.stealth.stealthLevel, 0);
    });
  });

  describe('setCover', () => {
    it('sets cover level', () => {
      const result = setCover(state, 'heavy');
      assert.ok(result.success);
      assert.strictEqual(result.cover, 'heavy');
    });

    it('fails for invalid cover', () => {
      const result = setCover(state, 'invalid');
      assert.ok(!result.success);
    });
  });

  describe('setNoiseLevel', () => {
    it('sets noise level', () => {
      const result = setNoiseLevel(state, 'silent');
      assert.ok(result.success);
      assert.strictEqual(result.noiseLevel, 'silent');
    });

    it('fails for invalid noise', () => {
      const result = setNoiseLevel(state, 'invalid');
      assert.ok(!result.success);
    });
  });

  describe('setLightLevel', () => {
    it('sets light level', () => {
      const result = setLightLevel(state, 'darkness');
      assert.ok(result.success);
      assert.strictEqual(result.lightLevel, 'darkness');
    });

    it('fails for invalid light', () => {
      const result = setLightLevel(state, 'invalid');
      assert.ok(!result.success);
    });
  });

  describe('calculateDetection', () => {
    it('returns 100% when not stealthed', () => {
      const result = calculateDetection(state, {});
      assert.ok(result.detected);
      assert.strictEqual(result.chance, 100);
    });

    it('returns chance when stealthed', () => {
      let result = enterStealth(state, 50);
      state = result.state;
      
      const detection = calculateDetection(state, { perception: 50 });
      assert.ok(!detection.detected);
      assert.ok(detection.chance < 100);
    });
  });

  describe('performDetectionCheck', () => {
    beforeEach(() => {
      const result = enterStealth(state, 50);
      state = result.state;
    });

    it('can detect with high roll', () => {
      const result = performDetectionCheck(state, { perception: 50 }, 10);
      assert.ok(result.detected);
    });

    it('stays hidden with low roll', () => {
      const result = performDetectionCheck(state, { perception: 20 }, 99);
      assert.ok(!result.detected);
    });

    it('increments stats on successful sneak', () => {
      const result = performDetectionCheck(state, { perception: 20 }, 99);
      assert.strictEqual(result.state.stealth.stats.successfulSneaks, 1);
    });

    it('increments detection stats', () => {
      const result = performDetectionCheck(state, { perception: 80 }, 10);
      if (result.detected) {
        assert.strictEqual(result.state.stealth.stats.timesDetected, 1);
      }
    });
  });

  describe('calculateAmbushBonus', () => {
    it('returns no bonus when not stealthed', () => {
      const result = calculateAmbushBonus(state, 'unaware');
      assert.ok(!result.canAmbush);
    });

    it('returns bonus when stealthed', () => {
      let result = enterStealth(state, 80);
      state = result.state;
      
      const ambush = calculateAmbushBonus(state, 'unaware');
      assert.ok(ambush.canAmbush);
    });

    it('reduces bonus for suspicious targets', () => {
      let result = enterStealth(state, 60);
      state = result.state;
      
      const unaware = calculateAmbushBonus(state, 'unaware');
      const suspicious = calculateAmbushBonus(state, 'suspicious');
      
      assert.ok(unaware.bonus.damageBonus >= suspicious.bonus.damageBonus);
    });
  });

  describe('performAmbush', () => {
    beforeEach(() => {
      const result = enterStealth(state, 80);
      state = result.state;
    });

    it('performs ambush attack', () => {
      const result = performAmbush(state, 100, 'unaware');
      assert.ok(result.success);
      assert.ok(result.damage > 100);
    });

    it('exits stealth after ambush', () => {
      const result = performAmbush(state, 100, 'unaware');
      assert.ok(!result.state.stealth.isStealthed);
    });

    it('increments ambush stats', () => {
      const result = performAmbush(state, 100, 'unaware');
      assert.strictEqual(result.state.stealth.stats.ambushes, 1);
    });
  });

  describe('increaseSuspicion', () => {
    it('increases suspicion', () => {
      const result = increaseSuspicion(state, 20);
      assert.ok(result.success);
      assert.strictEqual(result.suspicionLevel, 20);
    });

    it('caps at 100', () => {
      const result = increaseSuspicion(state, 150);
      assert.strictEqual(result.suspicionLevel, 100);
    });

    it('signals alert at 100', () => {
      const result = increaseSuspicion(state, 100);
      assert.ok(result.alert);
    });
  });

  describe('decreaseSuspicion', () => {
    it('decreases suspicion', () => {
      let result = increaseSuspicion(state, 50);
      state = result.state;
      
      result = decreaseSuspicion(state, 20);
      assert.strictEqual(result.suspicionLevel, 30);
    });

    it('floors at 0', () => {
      const result = decreaseSuspicion(state, 50);
      assert.strictEqual(result.suspicionLevel, 0);
    });
  });

  describe('getStealthStatus', () => {
    it('returns status', () => {
      const status = getStealthStatus(state);
      assert.ok('isStealthed' in status);
      assert.ok('suspicionLevel' in status);
    });
  });

  describe('getStealthStats', () => {
    it('returns stats', () => {
      const stats = getStealthStats(state);
      assert.ok('successfulSneaks' in stats);
      assert.ok('ambushes' in stats);
    });
  });

  describe('canEnterStealth', () => {
    it('can enter initially', () => {
      const result = canEnterStealth(state);
      assert.ok(result.canEnter);
    });

    it('cannot enter when already stealthed', () => {
      let result = enterStealth(state, 50);
      state = result.state;
      
      const check = canEnterStealth(state);
      assert.ok(!check.canEnter);
    });

    it('cannot enter at high alert', () => {
      let result = increaseSuspicion(state, 100);
      state = result.state;
      
      const check = canEnterStealth(state);
      assert.ok(!check.canEnter);
    });
  });
});

describe('Stealth System UI', () => {
  let state;

  beforeEach(() => {
    const result = initStealthState({});
    state = result.state;
  });

  describe('renderStealthPanel', () => {
    it('renders panel', () => {
      const html = renderStealthPanel(state);
      assert.ok(html.includes('stealth-panel'));
      assert.ok(html.includes('Stealth'));
    });
  });

  describe('renderStealthActive', () => {
    it('renders active state', () => {
      const status = {
        stealthLevel: 75,
        stealthState: STEALTH_STATES.HIDDEN
      };
      
      const html = renderStealthActive(status);
      assert.ok(html.includes('stealth-active'));
      assert.ok(html.includes('75'));
    });
  });

  describe('renderStealthInactive', () => {
    it('renders inactive state', () => {
      const html = renderStealthInactive(state);
      assert.ok(html.includes('Enter Stealth'));
    });
  });

  describe('renderSuspicionMeter', () => {
    it('renders meter', () => {
      const html = renderSuspicionMeter(50);
      assert.ok(html.includes('suspicion-meter'));
      assert.ok(html.includes('50%'));
    });

    it('shows alert at 100', () => {
      const html = renderSuspicionMeter(100);
      assert.ok(html.includes('alert-icon'));
    });
  });

  describe('renderEnvironment', () => {
    it('renders environment', () => {
      const status = {
        cover: COVER_LEVELS.HEAVY,
        noiseLevel: 'quiet',
        lightLevel: 'dim'
      };
      
      const html = renderEnvironment(status);
      assert.ok(html.includes('Cover'));
      assert.ok(html.includes('Noise'));
      assert.ok(html.includes('Light'));
    });
  });

  describe('renderCoverSelector', () => {
    it('renders cover options', () => {
      const html = renderCoverSelector('none');
      assert.ok(html.includes('cover-selector'));
      assert.ok(html.includes('No Cover'));
      assert.ok(html.includes('Full Cover'));
    });
  });

  describe('renderLightSelector', () => {
    it('renders light options', () => {
      const html = renderLightSelector('normal');
      assert.ok(html.includes('light-selector'));
      assert.ok(html.includes('Darkness'));
    });
  });

  describe('renderDetectionPreview', () => {
    it('renders preview when visible', () => {
      const html = renderDetectionPreview(state, {});
      assert.ok(html.includes('detection-preview'));
    });
  });

  describe('renderAmbushPreview', () => {
    it('shows unavailable when not stealthed', () => {
      const html = renderAmbushPreview(state, 'unaware');
      assert.ok(html.includes('unavailable'));
    });

    it('shows preview when stealthed', () => {
      let result = enterStealth(state, 80);
      state = result.state;
      
      const html = renderAmbushPreview(state, 'unaware');
      assert.ok(html.includes('available'));
    });
  });

  describe('renderAmbushTypes', () => {
    it('renders ambush types', () => {
      const html = renderAmbushTypes();
      assert.ok(html.includes('Ambush Types'));
      assert.ok(html.includes('Backstab'));
    });
  });

  describe('renderStealthStates', () => {
    it('renders stealth states', () => {
      const html = renderStealthStates();
      assert.ok(html.includes('Stealth States'));
      assert.ok(html.includes('Hidden'));
    });
  });

  describe('renderDetectionTypes', () => {
    it('renders detection types', () => {
      const html = renderDetectionTypes();
      assert.ok(html.includes('Detection Methods'));
      assert.ok(html.includes('Sight'));
    });
  });

  describe('renderStealthStats', () => {
    it('renders stats', () => {
      const html = renderStealthStats(state);
      assert.ok(html.includes('Statistics'));
      assert.ok(html.includes('Successful Sneaks'));
    });
  });

  describe('renderCompactStealth', () => {
    it('renders compact indicator', () => {
      const html = renderCompactStealth(state);
      assert.ok(html.includes('stealth-compact'));
    });
  });

  describe('renderAlertNotification', () => {
    it('renders notifications', () => {
      const html = renderAlertNotification('alert');
      assert.ok(html.includes('ALERT'));
    });
  });

  describe('renderNoiseIndicator', () => {
    it('renders noise indicator', () => {
      const html = renderNoiseIndicator('loud');
      assert.ok(html.includes('noise-indicator'));
      assert.ok(html.includes('Loud'));
    });
  });

  describe('XSS Prevention', () => {
    it('escapes state names', () => {
      const status = {
        stealthLevel: 50,
        stealthState: { id: 'test', name: '<script>alert("xss")</script>', detectionMod: 0 }
      };
      
      const html = renderStealthActive(status);
      assert.ok(!html.includes('<script>'));
    });

    it('escapes cover names', () => {
      const status = {
        cover: { name: '<script>bad</script>', bonus: 0 },
        noiseLevel: 'normal',
        lightLevel: 'normal'
      };
      
      const html = renderEnvironment(status);
      assert.ok(!html.includes('<script>bad</script>'));
    });
  });
});
